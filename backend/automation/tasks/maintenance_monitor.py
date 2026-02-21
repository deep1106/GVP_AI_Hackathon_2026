"""FleetFlow – Maintenance Reminder Engine (daily background job)."""

import logging
import time
from datetime import datetime, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.models import (
    Vehicle, MaintenanceLog, MaintenanceStatus, AutomationLog,
    NotificationType, NotificationSeverity
)
from automation.notification_helper import create_notification
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_maintenance_monitor():
    """
    Daily job: checks if any vehicle's odometer has exceeded the service interval
    since the last completed maintenance.
    """
    start = time.monotonic()
    processed = 0
    errors = None

    async with async_session() as db:
        try:
            vehicles = (await db.execute(select(Vehicle))).scalars().all()
            km_interval = settings.MAINTENANCE_KM_INTERVAL

            for vehicle in vehicles:
                # Find last completed maintenance for this vehicle
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
                km_since_service = vehicle.odometer_km - last_service_km

                if km_since_service >= km_interval:
                    # Check if we already have an open maintenance alert
                    existing_alert = (await db.execute(
                        select(MaintenanceLog).where(
                            MaintenanceLog.vehicle_id == vehicle.id,
                            MaintenanceLog.status == MaintenanceStatus.SCHEDULED,
                            MaintenanceLog.maintenance_type == "preventive_auto",
                        )
                    )).scalar_one_or_none()

                    if not existing_alert:
                        # Auto-create a maintenance record
                        from datetime import timedelta
                        sched = date.today() + timedelta(days=7)
                        new_maint = MaintenanceLog(
                            vehicle_id=vehicle.id,
                            description=f"Auto-scheduled: {km_since_service:.0f} km since last service",
                            maintenance_type="preventive_auto",
                            scheduled_date=sched,
                            odometer_at_service=vehicle.odometer_km,
                        )
                        db.add(new_maint)
                        await db.commit()

                        await create_notification(
                            db,
                            type=NotificationType.MAINTENANCE,
                            severity=NotificationSeverity.WARNING,
                            title=f"🔧 Maintenance Due – {vehicle.registration_number}",
                            message=(
                                f"Vehicle {vehicle.registration_number} ({vehicle.make} {vehicle.model}) "
                                f"has driven {km_since_service:.0f} km since last service "
                                f"(threshold: {km_interval:.0f} km). Scheduled for {sched}."
                            ),
                            entity_type="vehicle",
                            entity_id=vehicle.id,
                        )
                        processed += 1

        except Exception as exc:
            errors = str(exc)
            logger.error(f"[MaintenanceMonitor] Error: {exc}")
            await db.rollback()
        finally:
            elapsed = int((time.monotonic() - start) * 1000)
            log = AutomationLog(
                job_name="maintenance_monitor",
                status="error" if errors else "success",
                records_processed=processed,
                error_message=errors,
                duration_ms=elapsed,
            )
            db.add(log)
            await db.commit()
            logger.info(f"[MaintenanceMonitor] done – processed={processed}, duration={elapsed}ms")
