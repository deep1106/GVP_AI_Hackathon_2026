"""FleetFlow – Financial Monitor: budget threshold check (daily background job)."""

import logging
import time
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.models import (
    FuelLog, MaintenanceLog, AutomationLog,
    NotificationType, NotificationSeverity
)
from automation.notification_helper import create_notification
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def run_financial_monitor():
    """Daily job: check whether the fleet has exceeded the monthly budget threshold."""
    start = time.monotonic()
    processed = 0
    errors = None

    async with async_session() as db:
        try:
            now = datetime.utcnow()
            year, month = now.year, now.month

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

            total = float(fuel_cost) + float(maint_cost)
            threshold = settings.BUDGET_THRESHOLD_MONTHLY

            logger.info(f"[FinancialMonitor] {year}-{month:02d} total=₹{total:,.2f} threshold=₹{threshold:,.2f}")

            if total > threshold:
                pct_over = ((total - threshold) / threshold) * 100
                await create_notification(
                    db,
                    type=NotificationType.FINANCIAL,
                    severity=NotificationSeverity.CRITICAL,
                    title="💸 Monthly Budget Exceeded",
                    message=(
                        f"Fleet operational cost for {year}-{month:02d} is ₹{total:,.2f} "
                        f"({pct_over:.1f}% over threshold of ₹{threshold:,.2f})."
                    ),
                )
                processed += 1

        except Exception as exc:
            errors = str(exc)
            logger.error(f"[FinancialMonitor] Error: {exc}")
            await db.rollback()
        finally:
            elapsed = int((time.monotonic() - start) * 1000)
            log = AutomationLog(
                job_name="financial_monitor",
                status="error" if errors else "success",
                records_processed=processed,
                error_message=errors,
                duration_ms=elapsed,
            )
            db.add(log)
            await db.commit()
            logger.info(f"[FinancialMonitor] done – duration={elapsed}ms")
