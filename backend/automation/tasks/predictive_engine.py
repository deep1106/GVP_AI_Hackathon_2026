"""FleetFlow – Predictive Maintenance Engine (daily background job).

Uses historical odometer growth rate (km/day) to estimate the date
by which each vehicle will hit the next maintenance threshold.
"""

import logging
import time
from datetime import datetime, date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.models import (
    Vehicle, Trip, MaintenanceLog, MaintenanceStatus, AnalyticsSummary, AutomationLog
)
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_predictive_maintenance():
    """Daily job: estimate next service date for each vehicle."""
    start = time.monotonic()
    processed = 0
    errors = None

    async with async_session() as db:
        try:
            vehicles = (await db.execute(select(Vehicle))).scalars().all()
            now = datetime.utcnow()
            year, month = now.year, now.month

            for vehicle in vehicles:
                # Average km/day from trips in the last 90 days
                ninety_days_ago = now - timedelta(days=90)
                trip_data = (await db.execute(
                    select(func.sum(Trip.distance_km), func.count(Trip.id)).where(
                        Trip.vehicle_id == vehicle.id,
                        Trip.status == "completed",
                        Trip.actual_departure >= ninety_days_ago,
                    )
                )).one()
                total_km_90, trip_count = trip_data
                total_km_90 = float(total_km_90 or 0)

                if total_km_90 <= 0:
                    continue  # No trip data — skip prediction

                km_per_day = total_km_90 / 90.0

                # Find last service odometer
                last_service = (await db.execute(
                    select(MaintenanceLog)
                    .where(
                        MaintenanceLog.vehicle_id == vehicle.id,
                        MaintenanceLog.status == MaintenanceStatus.COMPLETED,
                    )
                    .order_by(MaintenanceLog.odometer_at_service.desc())
                    .limit(1)
                )).scalar_one_or_none()

                last_service_km = last_service.odometer_at_service if last_service else 0
                next_service_km = last_service_km + settings.MAINTENANCE_KM_INTERVAL
                km_remaining = max(next_service_km - vehicle.odometer_km, 0)
                days_to_service = int(km_remaining / km_per_day) if km_per_day > 0 else None
                predicted_date = date.today() + timedelta(days=days_to_service) if days_to_service is not None else None

                # Upsert into analytics_summary
                existing = (await db.execute(
                    select(AnalyticsSummary).where(
                        AnalyticsSummary.period_year == year,
                        AnalyticsSummary.period_month == month,
                        AnalyticsSummary.vehicle_id == vehicle.id,
                    )
                )).scalar_one_or_none()

                if existing:
                    existing.predicted_next_service_km = next_service_km
                    existing.predicted_next_service_date = predicted_date
                    existing.updated_at = datetime.utcnow()
                else:
                    db.add(AnalyticsSummary(
                        period_year=year, period_month=month, vehicle_id=vehicle.id,
                        predicted_next_service_km=next_service_km,
                        predicted_next_service_date=predicted_date,
                    ))

                await db.commit()
                processed += 1
                logger.info(
                    f"[PredictiveEngine] {vehicle.registration_number}: "
                    f"next service ~{predicted_date} ({km_remaining:.0f} km remaining)"
                )

        except Exception as exc:
            errors = str(exc)
            logger.error(f"[PredictiveEngine] Error: {exc}")
            await db.rollback()
        finally:
            elapsed = int((time.monotonic() - start) * 1000)
            log = AutomationLog(
                job_name="predictive_maintenance",
                status="error" if errors else "success",
                records_processed=processed,
                error_message=errors,
                duration_ms=elapsed,
            )
            db.add(log)
            await db.commit()
            logger.info(f"[PredictiveEngine] done – processed={processed}, duration={elapsed}ms")
