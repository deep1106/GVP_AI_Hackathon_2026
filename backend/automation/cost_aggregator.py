"""FleetFlow – Real-time cost aggregator.

Recalculates monthly per-vehicle and fleet-wide operational costs
and stores precomputed values in analytics_summary.
"""

import logging
from datetime import datetime, date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import (
    FuelLog, MaintenanceLog, Trip, AnalyticsSummary, Notification,
    NotificationType, NotificationSeverity
)
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def recalculate_vehicle_costs(db: AsyncSession, vehicle_id: str) -> AnalyticsSummary:
    """Upsert monthly cost summary for a specific vehicle."""
    now = datetime.utcnow()
    year, month = now.year, now.month

    # Fuel costs this month
    fuel_cost = (await db.execute(
        select(func.coalesce(func.sum(FuelLog.total_cost), 0)).where(
            FuelLog.vehicle_id == vehicle_id,
            func.extract("year", FuelLog.date) == year,
            func.extract("month", FuelLog.date) == month,
        )
    )).scalar() or 0

    # Maintenance costs this month
    maint_cost = (await db.execute(
        select(func.coalesce(func.sum(MaintenanceLog.cost), 0)).where(
            MaintenanceLog.vehicle_id == vehicle_id,
            func.extract("year", MaintenanceLog.scheduled_date) == year,
            func.extract("month", MaintenanceLog.scheduled_date) == month,
        )
    )).scalar() or 0

    # Trip count + distance this month
    trip_stats = (await db.execute(
        select(
            func.count(Trip.id),
            func.coalesce(func.sum(Trip.distance_km), 0)
        ).where(
            Trip.vehicle_id == vehicle_id,
            func.extract("year", Trip.scheduled_departure) == year,
            func.extract("month", Trip.scheduled_departure) == month,
        )
    )).one()
    trip_count, total_dist = trip_stats

    # Fuel efficiency (km / litre)
    total_litres = (await db.execute(
        select(func.coalesce(func.sum(FuelLog.quantity_liters), 0)).where(
            FuelLog.vehicle_id == vehicle_id,
            func.extract("year", FuelLog.date) == year,
            func.extract("month", FuelLog.date) == month,
        )
    )).scalar() or 0

    efficiency = float(total_dist) / float(total_litres) if total_litres > 0 else 0

    # Upsert
    existing = (await db.execute(
        select(AnalyticsSummary).where(
            AnalyticsSummary.period_year == year,
            AnalyticsSummary.period_month == month,
            AnalyticsSummary.vehicle_id == vehicle_id,
        )
    )).scalar_one_or_none()

    total_cost = float(fuel_cost) + float(maint_cost)
    if existing:
        existing.total_fuel_cost = float(fuel_cost)
        existing.total_maintenance_cost = float(maint_cost)
        existing.total_operational_cost = total_cost
        existing.total_trips = trip_count
        existing.total_distance_km = float(total_dist)
        existing.avg_fuel_efficiency = efficiency
        existing.updated_at = datetime.utcnow()
        summary = existing
    else:
        summary = AnalyticsSummary(
            period_year=year, period_month=month, vehicle_id=vehicle_id,
            total_fuel_cost=float(fuel_cost),
            total_maintenance_cost=float(maint_cost),
            total_operational_cost=total_cost,
            total_trips=trip_count,
            total_distance_km=float(total_dist),
            avg_fuel_efficiency=efficiency,
        )
        db.add(summary)

    await db.commit()
    await db.refresh(summary)

    # Update fleet-wide summary too
    await recalculate_fleet_costs(db, year, month)

    return summary


async def recalculate_fleet_costs(db: AsyncSession, year: int, month: int):
    """Upsert the fleet-wide monthly cost row (vehicle_id = NULL)."""
    fuel_cost = (await db.execute(
        select(func.coalesce(func.sum(FuelLog.total_cost), 0)).where(
            func.extract("year", FuelLog.date) == year,
            func.extract("month", FuelLog.date) == month,
        )
    )).scalar() or 0

    maint_cost = (await db.execute(
        select(func.coalesce(func.sum(MaintenanceLog.cost), 0)).where(
            func.extract("year", MaintenanceLog.scheduled_date) == year,
            func.extract("month", MaintenanceLog.scheduled_date) == month,
        )
    )).scalar() or 0

    total_cost = float(fuel_cost) + float(maint_cost)

    existing = (await db.execute(
        select(AnalyticsSummary).where(
            AnalyticsSummary.period_year == year,
            AnalyticsSummary.period_month == month,
            AnalyticsSummary.vehicle_id.is_(None),
        )
    )).scalar_one_or_none()

    if existing:
        existing.total_fuel_cost = float(fuel_cost)
        existing.total_maintenance_cost = float(maint_cost)
        existing.total_operational_cost = total_cost
        existing.updated_at = datetime.utcnow()
    else:
        db.add(AnalyticsSummary(
            period_year=year, period_month=month, vehicle_id=None,
            total_fuel_cost=float(fuel_cost),
            total_maintenance_cost=float(maint_cost),
            total_operational_cost=total_cost,
        ))
    await db.commit()

    # Budget threshold check
    if total_cost > settings.BUDGET_THRESHOLD_MONTHLY:
        from automation.notification_helper import create_notification
        await create_notification(
            db,
            type=NotificationType.FINANCIAL,
            severity=NotificationSeverity.CRITICAL,
            title="💸 Monthly Budget Threshold Exceeded",
            message=(
                f"Total operational cost for {year}-{month:02d} is "
                f"₹{total_cost:,.2f}, exceeding the threshold of "
                f"₹{settings.BUDGET_THRESHOLD_MONTHLY:,.2f}."
            ),
        )
        logger.warning(f"[CostAggregator] Budget threshold exceeded: ₹{total_cost:,.2f}")
