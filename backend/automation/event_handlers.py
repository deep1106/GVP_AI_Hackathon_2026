"""FleetFlow – Event handlers wired to domain events."""

import logging
from database import async_session
from automation.event_dispatcher import register, Events

logger = logging.getLogger(__name__)


@register(Events.TRIP_DISPATCHED)
async def on_trip_dispatched(payload: dict):
    """Validate dispatch constraints asynchronously after a trip is created."""
    logger.info(f"[Handler] TripDispatched: trip_id={payload.get('trip_id')}")
    # Additional post-dispatch checks can be added here
    # (pre-dispatch validation is done inline in trip_router)


@register(Events.TRIP_COMPLETED)
async def on_trip_completed(payload: dict):
    """Update odometer reading when a trip is completed."""
    vehicle_id = payload.get("vehicle_id")
    distance_km = payload.get("distance_km", 0)
    if not vehicle_id or not distance_km:
        return

    async with async_session() as db:
        try:
            from sqlalchemy import select
            from models.models import Vehicle
            result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
            vehicle = result.scalar_one_or_none()
            if vehicle:
                vehicle.odometer_km = (vehicle.odometer_km or 0) + float(distance_km)
                await db.commit()
                logger.info(f"[Handler] Odometer updated for vehicle={vehicle_id}, +{distance_km} km")
        except Exception as exc:
            logger.error(f"[Handler] TripCompleted odometer update failed: {exc}")
            await db.rollback()


@register(Events.FUEL_LOGGED)
async def on_fuel_logged(payload: dict):
    """Trigger cost aggregation and anomaly detection when fuel is logged."""
    vehicle_id = payload.get("vehicle_id")
    if not vehicle_id:
        return
    from automation.cost_aggregator import recalculate_vehicle_costs
    from automation.tasks.fuel_anomaly import check_vehicle_fuel_anomaly
    async with async_session() as db:
        await recalculate_vehicle_costs(db, vehicle_id)
        await check_vehicle_fuel_anomaly(db, vehicle_id)


@register(Events.MAINTENANCE_CREATED)
async def on_maintenance_created(payload: dict):
    """Trigger cost aggregation when maintenance is logged."""
    vehicle_id = payload.get("vehicle_id")
    if not vehicle_id:
        return
    from automation.cost_aggregator import recalculate_vehicle_costs
    async with async_session() as db:
        await recalculate_vehicle_costs(db, vehicle_id)


@register(Events.DRIVER_LICENSE_EXPIRING)
async def on_driver_license_expiring(payload: dict):
    """Create a compliance notification for an expiring/expired license."""
    driver_id = payload.get("driver_id")
    driver_name = payload.get("driver_name", "Unknown Driver")
    days_left = payload.get("days_left", 0)

    from models.models import NotificationType, NotificationSeverity
    from automation.notification_helper import create_notification

    if days_left <= 0:
        severity = NotificationSeverity.CRITICAL
        title = f"🚨 License EXPIRED – {driver_name}"
        message = f"Driver {driver_name}'s license has expired. Driver suspended automatically."
    else:
        severity = NotificationSeverity.WARNING
        title = f"⚠️ License Expiring Soon – {driver_name}"
        message = f"Driver {driver_name}'s license expires in {days_left} days. Renewal required."

    async with async_session() as db:
        await create_notification(
            db,
            type=NotificationType.COMPLIANCE,
            severity=severity,
            title=title,
            message=message,
            entity_type="driver",
            entity_id=driver_id,
        )
