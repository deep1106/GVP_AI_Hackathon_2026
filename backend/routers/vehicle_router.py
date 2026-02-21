"""FleetFlow – Vehicles router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import Vehicle, User, UserRole
from schemas.schemas import VehicleCreate, VehicleUpdate, VehicleOut
from auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=dict)
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Vehicle)
    count_query = select(func.count(Vehicle.id))

    if status:
        query = query.where(Vehicle.status == status)
        count_query = count_query.where(Vehicle.status == status)
    if search:
        query = query.where(
            Vehicle.registration_number.ilike(f"%{search}%")
            | Vehicle.make.ilike(f"%{search}%")
            | Vehicle.model.ilike(f"%{search}%")
        )
        count_query = count_query.where(
            Vehicle.registration_number.ilike(f"%{search}%")
            | Vehicle.make.ilike(f"%{search}%")
            | Vehicle.model.ilike(f"%{search}%")
        )

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(Vehicle.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [VehicleOut.model_validate(v) for v in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/{vehicle_id}", response_model=VehicleOut)
async def get_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("", response_model=VehicleOut, status_code=201)
async def create_vehicle(
    body: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    vehicle = Vehicle(**body.model_dump())
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle(
    vehicle_id: str,
    body: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await db.delete(vehicle)
    await db.commit()
