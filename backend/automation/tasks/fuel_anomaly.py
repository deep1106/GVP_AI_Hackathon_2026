"""FleetFlow – Fuel Anomaly Detector.

Compares last-30-day consumption (L/100km) against the 90-day baseline.
If deviation exceeds FUEL_ANOMALY_THRESHOLD_PCT → creates an anomaly notification.
"""

import logging
import time
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.models import (
    Vehicle, FuelLog, Trip, AutomationLog,
    NotificationType, NotificationSeverity
)
from automation.notification_helper import create_notification
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def check_vehicle_fuel_anomaly(db: AsyncSession, vehicle_id: str):
    """Check a single vehicle for fuel consumption anomaly (called on FuelLogged event)."""
    now = datetime.utcnow()

    # 30-day window
    last_30 = now - timedelta(days=30)
    last_90 = now - timedelta(days=90)

    recent_fuel = (await db.execute(
        select(func.sum(FuelLog.quantity_liters)).where(
            FuelLog.vehicle_id == vehicle_id,
            FuelLog.date >= last_30.date(),
        )
    )).scalar() or 0

    recent_dist = (await db.execute(
        select(func.sum(Trip.distance_km)).where(
            Trip.vehicle_id == vehicle_id,
            Trip.status == "completed",
            Trip.actual_departure >= last_30,
        )
    )).scalar() or 0

    if recent_dist <= 0 or recent_fuel <= 0:
        return  # Not enough data

    # L/100km in last 30 days
    recent_efficiency = (float(recent_fuel) / float(recent_dist)) * 100

    # 90-day baseline
    baseline_fuel = (await db.execute(
        select(func.sum(FuelLog.quantity_liters)).where(
            FuelLog.vehicle_id == vehicle_id,
            FuelLog.date >= last_90.date(),
            FuelLog.date < last_30.date(),
        )
    )).scalar() or 0

    baseline_dist = (await db.execute(
        select(func.sum(Trip.distance_km)).where(
            Trip.vehicle_id == vehicle_id,
            Trip.status == "completed",
            Trip.actual_departure >= last_90,
            Trip.actual_departure < last_30,
        )
    )).scalar() or 0

    if baseline_dist <= 0 or baseline_fuel <= 0:
        return  # No baseline

    baseline_efficiency = (float(baseline_fuel) / float(baseline_dist)) * 100
    deviation_pct = abs(recent_efficiency - baseline_efficiency) / baseline_efficiency * 100

    if deviation_pct >= settings.FUEL_ANOMALY_THRESHOLD_PCT:
        vehicle = (await db.execute(
            select(Vehicle).where(Vehicle.id == vehicle_id)
        )).scalar_one_or_none()
        veh_label = vehicle.registration_number if vehicle else vehicle_id

        direction = "higher" if recent_efficiency > baseline_efficiency else "lower"
        await create_notification(
            db,
            type=NotificationType.OPERATIONAL,
            severity=NotificationSeverity.WARNING,
            title=f"⛽ Fuel Anomaly – {veh_label}",
            message=(
                f"Vehicle {veh_label} fuel consumption is {deviation_pct:.1f}% {direction} than the 3-month average "
                f"({recent_efficiency:.2f} vs {baseline_efficiency:.2f} L/100km)."
            ),
            entity_type="vehicle",
            entity_id=vehicle_id,
        )
        logger.warning(f"[FuelAnomaly] {veh_label}: {deviation_pct:.1f}% deviation detected")


async def run_fuel_anomaly_scan():
    """Daily job: scan all vehicles for fuel anomalies."""
    start = time.monotonic()
    processed = 0
    errors = None

    async with async_session() as db:
        try:
            vehicles = (await db.execute(select(Vehicle))).scalars().all()
            for vehicle in vehicles:
                await check_vehicle_fuel_anomaly(db, vehicle.id)
                processed += 1
        except Exception as exc:
            errors = str(exc)
            logger.error(f"[FuelAnomalyScan] Error: {exc}")
            await db.rollback()
        finally:
            elapsed = int((time.monotonic() - start) * 1000)
            log = AutomationLog(
                job_name="fuel_anomaly_scan",
                status="error" if errors else "success",
                records_processed=processed,
                error_message=errors,
                duration_ms=elapsed,
            )
            db.add(log)
            await db.commit()
            logger.info(f"[FuelAnomalyScan] done – processed={processed}, duration={elapsed}ms")
