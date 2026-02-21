"""FleetFlow – Fuel & expense logs router."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import FuelLog, Vehicle, User, UserRole
from schemas.schemas import FuelLogCreate, FuelLogUpdate, FuelLogOut
from auth.auth import get_current_user, require_roles
from automation.event_dispatcher import dispatch, Events

router = APIRouter(prefix="/api/fuel", tags=["fuel"])


@router.get("", response_model=dict)
async def list_fuel_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vehicle_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(FuelLog)
    count_query = select(func.count(FuelLog.id))

    if vehicle_id:
        query = query.where(FuelLog.vehicle_id == vehicle_id)
        count_query = count_query.where(FuelLog.vehicle_id == vehicle_id)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(FuelLog.date.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [FuelLogOut.model_validate(f) for f in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.post("", response_model=FuelLogOut, status_code=201)
async def create_fuel_log(
    body: FuelLogCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.FINANCIAL_ANALYST)),
):
    veh = (await db.execute(select(Vehicle).where(Vehicle.id == body.vehicle_id))).scalar_one_or_none()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    log = FuelLog(**body.model_dump())
    db.add(log)

    # Update vehicle odometer
    if body.odometer_reading > veh.odometer_km:
        veh.odometer_km = body.odometer_reading

    await db.commit()
    await db.refresh(log)

    # Fire FuelLogged event (triggers cost aggregation + anomaly detection)
    background_tasks.add_task(
        dispatch,
        Events.FUEL_LOGGED,
        {"fuel_log_id": log.id, "vehicle_id": log.vehicle_id, "total_cost": float(log.total_cost)},
        triggered_by=current_user.id,
    )
    return log


@router.put("/{log_id}", response_model=FuelLogOut)
async def update_fuel_log(
    log_id: str,
    body: FuelLogUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST)),
):
    result = await db.execute(select(FuelLog).where(FuelLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log, key, value)
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=204)
async def delete_fuel_log(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    result = await db.execute(select(FuelLog).where(FuelLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    await db.delete(log)
    await db.commit()
