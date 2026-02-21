"""FleetFlow – Trips router with lifecycle management."""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import Trip, Driver, Vehicle, User, UserRole, TripStatus, DriverStatus
from schemas.schemas import TripCreate, TripUpdate, TripOut
from auth.auth import get_current_user, require_roles
from automation.event_dispatcher import dispatch, Events

router = APIRouter(prefix="/api/trips", tags=["trips"])

VALID_TRANSITIONS = {
    TripStatus.SCHEDULED: [TripStatus.DISPATCHED, TripStatus.CANCELLED],
    TripStatus.DISPATCHED: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
    TripStatus.IN_PROGRESS: [TripStatus.COMPLETED, TripStatus.CANCELLED],
    TripStatus.COMPLETED: [],
    TripStatus.CANCELLED: [],
}


@router.get("", response_model=dict)
async def list_trips(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Trip)
    count_query = select(func.count(Trip.id))

    if status:
        query = query.where(Trip.status == status)
        count_query = count_query.where(Trip.status == status)
    if search:
        query = query.where(
            Trip.trip_number.ilike(f"%{search}%")
            | Trip.origin.ilike(f"%{search}%")
            | Trip.destination.ilike(f"%{search}%")
        )
        count_query = count_query.where(
            Trip.trip_number.ilike(f"%{search}%")
            | Trip.origin.ilike(f"%{search}%")
            | Trip.destination.ilike(f"%{search}%")
        )

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(Trip.scheduled_departure.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [TripOut.model_validate(t) for t in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/{trip_id}", response_model=TripOut)
async def get_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=TripOut, status_code=201)
async def create_trip(
    body: TripCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.DISPATCHER)),
):
    # Smart dispatch validation (comprehensive pre-flight checks)
    from automation.dispatch_validator import validate_dispatch
    validation = await validate_dispatch(
        db, body.vehicle_id, body.driver_id, body.cargo_weight_tons
    )
    if not validation.is_valid:
        raise HTTPException(status_code=422, detail={"automation_errors": validation.errors})

    # Validate vehicle exists and is active
    veh = (await db.execute(select(Vehicle).where(Vehicle.id == body.vehicle_id))).scalar_one_or_none()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if veh.status != "active":
        raise HTTPException(status_code=400, detail="Vehicle is not active")

    # Validate driver exists and is available
    drv = (await db.execute(select(Driver).where(Driver.id == body.driver_id))).scalar_one_or_none()
    if not drv:
        raise HTTPException(status_code=404, detail="Driver not found")
    if drv.status != DriverStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Driver is not available")

    # Check for duplicate dispatch – same driver or vehicle already dispatched/in_progress
    dup_check = await db.execute(
        select(Trip).where(
            Trip.status.in_([TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]),
            (Trip.vehicle_id == body.vehicle_id) | (Trip.driver_id == body.driver_id),
        )
    )
    if dup_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Vehicle or driver already assigned to an active trip")

    trip_number = f"TRP-{uuid.uuid4().hex[:8].upper()}"
    trip = Trip(
        trip_number=trip_number,
        **body.model_dump(),
        dispatched_by=current_user.id,
    )
    db.add(trip)
    await db.commit()
    await db.refresh(trip)

    # Fire domain event (non-blocking)
    background_tasks.add_task(
        dispatch,
        Events.TRIP_DISPATCHED,
        {"trip_id": trip.id, "vehicle_id": trip.vehicle_id, "driver_id": trip.driver_id},
        triggered_by=current_user.id,
    )
    return trip


@router.put("/{trip_id}", response_model=TripOut)
async def update_trip(
    trip_id: str,
    body: TripUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.DISPATCHER)),
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Validate status transition
    if body.status and body.status != trip.status:
        if body.status not in VALID_TRANSITIONS.get(trip.status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{trip.status.value}' to '{body.status.value}'",
            )

        # Side effects of transitions
        if body.status == TripStatus.IN_PROGRESS:
            # Mark driver as on_trip
            drv = (await db.execute(select(Driver).where(Driver.id == trip.driver_id))).scalar_one_or_none()
            if drv:
                drv.status = DriverStatus.ON_TRIP
            if not body.actual_departure:
                body.actual_departure = datetime.now(timezone.utc)

        elif body.status == TripStatus.COMPLETED:
            # Mark driver as available, increment trip count
            drv = (await db.execute(select(Driver).where(Driver.id == trip.driver_id))).scalar_one_or_none()
            if drv:
                drv.status = DriverStatus.AVAILABLE
                drv.total_trips += 1
            if not body.actual_arrival:
                body.actual_arrival = datetime.now(timezone.utc)
            # Fire TripCompleted event
            background_tasks.add_task(
                dispatch,
                Events.TRIP_COMPLETED,
                {
                    "trip_id": trip.id,
                    "vehicle_id": trip.vehicle_id,
                    "driver_id": trip.driver_id,
                    "distance_km": body.distance_km or trip.distance_km,
                },
                triggered_by=current_user.id,
            )

        elif body.status == TripStatus.CANCELLED:
            drv = (await db.execute(select(Driver).where(Driver.id == trip.driver_id))).scalar_one_or_none()
            if drv and drv.status == DriverStatus.ON_TRIP:
                drv.status = DriverStatus.AVAILABLE

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trip, key, value)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    await db.delete(trip)
    await db.commit()
