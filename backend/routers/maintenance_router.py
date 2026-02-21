"""FleetFlow – Maintenance logs router."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import MaintenanceLog, Vehicle, User, UserRole, MaintenanceStatus, VehicleStatus
from schemas.schemas import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from auth.auth import get_current_user, require_roles
from automation.event_dispatcher import dispatch, Events

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("", response_model=dict)
async def list_maintenance(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vehicle_id: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MaintenanceLog)
    count_query = select(func.count(MaintenanceLog.id))

    if vehicle_id:
        query = query.where(MaintenanceLog.vehicle_id == vehicle_id)
        count_query = count_query.where(MaintenanceLog.vehicle_id == vehicle_id)
    if status:
        query = query.where(MaintenanceLog.status == status)
        count_query = count_query.where(MaintenanceLog.status == status)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(MaintenanceLog.scheduled_date.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [MaintenanceOut.model_validate(m) for m in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.post("", response_model=MaintenanceOut, status_code=201)
async def create_maintenance(
    body: MaintenanceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER)),
):
    # Validate vehicle
    veh = (await db.execute(select(Vehicle).where(Vehicle.id == body.vehicle_id))).scalar_one_or_none()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    log = MaintenanceLog(**body.model_dump())
    db.add(log)

    # Set vehicle to maintenance status
    veh.status = VehicleStatus.MAINTENANCE
    await db.commit()
    await db.refresh(log)

    # Fire MaintenanceCreated event (triggers cost aggregation)
    background_tasks.add_task(
        dispatch,
        Events.MAINTENANCE_CREATED,
        {"maintenance_id": log.id, "vehicle_id": log.vehicle_id, "cost": float(log.cost)},
        triggered_by=current_user.id,
    )
    return log


@router.put("/{log_id}", response_model=MaintenanceOut)
async def update_maintenance(
    log_id: str,
    body: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER)),
):
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    update_data = body.model_dump(exclude_unset=True)

    # If completing maintenance, set vehicle back to active
    if body.status == MaintenanceStatus.COMPLETED:
        veh = (await db.execute(select(Vehicle).where(Vehicle.id == log.vehicle_id))).scalar_one_or_none()
        if veh and veh.status == VehicleStatus.MAINTENANCE:
            veh.status = VehicleStatus.ACTIVE

    for key, value in update_data.items():
        setattr(log, key, value)
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=204)
async def delete_maintenance(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER)),
):
    result = await db.execute(select(MaintenanceLog).where(MaintenanceLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    await db.delete(log)
    await db.commit()
