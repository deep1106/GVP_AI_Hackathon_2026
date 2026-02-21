"""FleetFlow – License Expiry Monitor (daily background job)."""

import logging
import time
from datetime import datetime, timedelta, date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.models import (
    Driver, DriverStatus, AutomationLog,
    NotificationType, NotificationSeverity
)
from automation.notification_helper import create_notification
from automation.event_dispatcher import dispatch, Events
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_license_monitor():
    """
    Daily job: checks all driver license expiry dates.
    - < LICENSE_WARN_DAYS → WARNING notification
    - Expired → auto-suspend + CRITICAL notification
    """
    start = time.monotonic()
    processed = 0
    errors = None

    async with async_session() as db:
        try:
            today = date.today()
            warn_date = today + timedelta(days=settings.LICENSE_WARN_DAYS)

            drivers = (await db.execute(select(Driver))).scalars().all()

            for driver in drivers:
                expiry = driver.license_expiry
                days_left = (expiry - today).days

                if expiry < today:
                    # Expired → suspend
                    if driver.status not in (DriverStatus.SUSPENDED, DriverStatus.OFF_DUTY):
                        driver.status = DriverStatus.SUSPENDED
                        await db.commit()
                        logger.warning(f"Driver {driver.full_name} suspended – license expired {expiry}")

                    await create_notification(
                        db,
                        type=NotificationType.COMPLIANCE,
                        severity=NotificationSeverity.CRITICAL,
                        title=f"🚨 License EXPIRED – {driver.full_name}",
                        message=f"Driver {driver.full_name} (ID: {driver.employee_id}) license expired {expiry}. Auto-suspended.",
                        entity_type="driver",
                        entity_id=driver.id,
                    )
                    processed += 1

                elif expiry <= warn_date:
                    # Expiring soon → warn
                    await create_notification(
                        db,
                        type=NotificationType.COMPLIANCE,
                        severity=NotificationSeverity.WARNING,
                        title=f"⚠️ License Expiring – {driver.full_name}",
                        message=f"Driver {driver.full_name} license expires in {days_left} days ({expiry}). Please renew.",
                        entity_type="driver",
                        entity_id=driver.id,
                    )
                    processed += 1

        except Exception as exc:
            errors = str(exc)
            logger.error(f"[LicenseMonitor] Error: {exc}")
            await db.rollback()
        finally:
            elapsed = int((time.monotonic() - start) * 1000)
            log = AutomationLog(
                job_name="license_monitor",
                status="error" if errors else "success",
                records_processed=processed,
                error_message=errors,
                duration_ms=elapsed,
            )
            db.add(log)
            await db.commit()
            logger.info(f"[LicenseMonitor] done – processed={processed}, duration={elapsed}ms")
