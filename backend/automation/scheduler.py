"""FleetFlow – APScheduler setup for background automation jobs."""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


def setup_scheduler():
    """Register all automation jobs with the scheduler."""

    # ── Safety: License expiry monitor (daily at 02:00) ───────────────────
    from automation.tasks.license_monitor import run_license_monitor
    scheduler.add_job(
        run_license_monitor,
        CronTrigger(hour=2, minute=0),
        id="license_monitor",
        name="Driver License Expiry Monitor",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # ── Operations: Maintenance reminder (daily at 03:00) ─────────────────
    from automation.tasks.maintenance_monitor import run_maintenance_monitor
    scheduler.add_job(
        run_maintenance_monitor,
        CronTrigger(hour=3, minute=0),
        id="maintenance_monitor",
        name="Maintenance Reminder Engine",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # ── Predictive: Predictive maintenance (daily at 04:00) ───────────────
    from automation.tasks.predictive_engine import run_predictive_maintenance
    scheduler.add_job(
        run_predictive_maintenance,
        CronTrigger(hour=4, minute=0),
        id="predictive_maintenance",
        name="Predictive Maintenance Engine",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # ── Finance: Fuel anomaly scan (daily at 05:00) ───────────────────────
    from automation.tasks.fuel_anomaly import run_fuel_anomaly_scan
    scheduler.add_job(
        run_fuel_anomaly_scan,
        CronTrigger(hour=5, minute=0),
        id="fuel_anomaly_scan",
        name="Fuel Anomaly Scanner",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # ── Finance: Budget threshold check (daily at 06:00) ──────────────────
    from automation.tasks.financial_monitor import run_financial_monitor
    scheduler.add_job(
        run_financial_monitor,
        CronTrigger(hour=6, minute=0),
        id="financial_monitor",
        name="Monthly Budget Monitor",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    logger.info("[Scheduler] All automation jobs registered.")


def start_scheduler():
    setup_scheduler()
    scheduler.start()
    logger.info("[Scheduler] APScheduler started.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] APScheduler stopped.")
