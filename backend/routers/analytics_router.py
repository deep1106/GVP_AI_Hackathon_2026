"""FleetFlow – Analytics / Dashboard KPI router."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Vehicle, Driver, Trip, FuelLog, MaintenanceLog, User, VehicleStatus, DriverStatus, TripStatus
from schemas.schemas import DashboardKPIs
from auth.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vehicles
    total_vehicles = (await db.execute(select(func.count(Vehicle.id)))).scalar() or 0
    active_vehicles = (await db.execute(
        select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.ACTIVE)
    )).scalar() or 0

    # Drivers
    total_drivers = (await db.execute(select(func.count(Driver.id)))).scalar() or 0
    available_drivers = (await db.execute(
        select(func.count(Driver.id)).where(Driver.status == DriverStatus.AVAILABLE)
    )).scalar() or 0

    # Trips
    total_trips = (await db.execute(select(func.count(Trip.id)))).scalar() or 0
    completed_trips = (await db.execute(
        select(func.count(Trip.id)).where(Trip.status == TripStatus.COMPLETED)
    )).scalar() or 0
    in_progress_trips = (await db.execute(
        select(func.count(Trip.id)).where(Trip.status == TripStatus.IN_PROGRESS)
    )).scalar() or 0

    # Costs
    total_fuel_cost = (await db.execute(select(func.coalesce(func.sum(FuelLog.total_cost), 0)))).scalar() or 0
    total_maintenance_cost = (await db.execute(
        select(func.coalesce(func.sum(MaintenanceLog.cost), 0))
    )).scalar() or 0

    # Avg safety score
    avg_safety = (await db.execute(
        select(func.coalesce(func.avg(Driver.safety_score), 100))
    )).scalar() or 100

    # Fleet utilization
    fleet_util = (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0

    # On-time delivery
    on_time = 0.0
    if completed_trips > 0:
        on_time_count = (await db.execute(
            select(func.count(Trip.id)).where(
                Trip.status == TripStatus.COMPLETED,
                Trip.actual_arrival <= Trip.scheduled_arrival,
            )
        )).scalar() or 0
        on_time = (on_time_count / completed_trips) * 100

    return DashboardKPIs(
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        total_drivers=total_drivers,
        available_drivers=available_drivers,
        total_trips=total_trips,
        completed_trips=completed_trips,
        in_progress_trips=in_progress_trips,
        total_fuel_cost=float(total_fuel_cost),
        total_maintenance_cost=float(total_maintenance_cost),
        avg_safety_score=round(float(avg_safety), 1),
        fleet_utilization_pct=round(fleet_util, 1),
        on_time_delivery_pct=round(on_time, 1),
    )
