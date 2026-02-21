"""FleetFlow – Drivers router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import Driver, User, UserRole
from schemas.schemas import DriverCreate, DriverUpdate, DriverOut
from auth.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


@router.get("", response_model=dict)
async def list_drivers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Driver)
    count_query = select(func.count(Driver.id))

    if status:
        query = query.where(Driver.status == status)
        count_query = count_query.where(Driver.status == status)
    if search:
        query = query.where(
            Driver.full_name.ilike(f"%{search}%")
            | Driver.employee_id.ilike(f"%{search}%")
        )
        count_query = count_query.where(
            Driver.full_name.ilike(f"%{search}%")
            | Driver.employee_id.ilike(f"%{search}%")
        )

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(Driver.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [DriverOut.model_validate(d) for d in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/{driver_id}", response_model=DriverOut)
async def get_driver(
    driver_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.post("", response_model=DriverOut, status_code=201)
async def create_driver(
    body: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.DISPATCHER)),
):
    driver = Driver(**body.model_dump())
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver


@router.put("/{driver_id}", response_model=DriverOut)
async def update_driver(
    driver_id: str,
    body: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER, UserRole.DISPATCHER, UserRole.SAFETY_OFFICER)),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)
    await db.commit()
    await db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.FLEET_MANAGER)),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    await db.delete(driver)
    await db.commit()
