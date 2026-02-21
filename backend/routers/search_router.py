"""FleetFlow – Global Search router."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Vehicle, Driver, Trip, User
from auth.auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("", response_model=dict)
async def global_search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Global search across vehicles, drivers, and trips."""
    search_term = f"%{q}%"
    
    # 1. Search Vehicles
    veh_query = select(Vehicle).where(
        or_(
            Vehicle.registration_number.ilike(search_term),
            Vehicle.make.ilike(search_term),
            Vehicle.model.ilike(search_term),
            Vehicle.vin.ilike(search_term),
        )
    ).limit(5)
    
    # 2. Search Drivers
    drv_query = select(Driver).where(
        or_(
            Driver.full_name.ilike(search_term),
            Driver.employee_id.ilike(search_term),
            Driver.license_number.ilike(search_term),
            Driver.phone.ilike(search_term),
        )
    ).limit(5)
    
    # 3. Search Trips
    trp_query = select(Trip).where(
        or_(
            Trip.trip_number.ilike(search_term),
            Trip.origin.ilike(search_term),
            Trip.destination.ilike(search_term),
        )
    ).limit(5)
    
    # Execute concurrently conceptually (or just await them sequentially, it's fast)
    veh_results = (await db.execute(veh_query)).scalars().all()
    drv_results = (await db.execute(drv_query)).scalars().all()
    trp_results = (await db.execute(trp_query)).scalars().all()
    
    return {
        "vehicles": [
            {
                "id": v.id, 
                "title": v.registration_number, 
                "subtitle": f"{v.make} {v.model}", 
                "type": "vehicle"
            } for v in veh_results
        ],
        "drivers": [
            {
                "id": d.id, 
                "title": d.full_name, 
                "subtitle": d.employee_id, 
                "type": "driver"
            } for d in drv_results
        ],
        "trips": [
            {
                "id": t.id, 
                "title": t.trip_number, 
                "subtitle": f"{t.origin} → {t.destination}", 
                "type": "trip"
            } for t in trp_results
        ]
    }
