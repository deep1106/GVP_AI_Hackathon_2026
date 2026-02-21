"""FleetFlow – Lightweight in-process domain event dispatcher."""

import json
import logging
from datetime import datetime
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

# Registry: event_type → list of async handler coroutine functions
_handlers: dict[str, list[Callable[..., Coroutine]]] = {}


def register(event_type: str):
    """Decorator to register an async handler for a domain event."""
    def decorator(fn: Callable[..., Coroutine]):
        _handlers.setdefault(event_type, []).append(fn)
        return fn
    return decorator


async def dispatch(event_type: str, payload: dict[str, Any], db=None, triggered_by: str | None = None):
    """
    Fire a domain event asynchronously.
    - Persists the event to domain_events table (if db provided)
    - Calls all registered async handlers
    """
    logger.info(f"[EventDispatcher] dispatching event={event_type}")

    # Persist event to DB
    if db is not None:
        try:
            from models.models import DomainEvent
            event_row = DomainEvent(
                event_type=event_type,
                payload=json.dumps(payload),
                triggered_by=triggered_by,
            )
            db.add(event_row)
            await db.commit()
        except Exception as exc:
            logger.warning(f"[EventDispatcher] failed to persist event {event_type}: {exc}")

    # Invoke handlers (do not block each other)
    handlers = _handlers.get(event_type, [])
    for handler in handlers:
        try:
            await handler(payload)
        except Exception as exc:
            logger.error(f"[EventDispatcher] handler {handler.__name__} failed for {event_type}: {exc}")


# ── Domain Event Name Constants ─────────────────────────────────────────────

class Events:
    TRIP_DISPATCHED = "TripDispatched"
    TRIP_COMPLETED = "TripCompleted"
    MAINTENANCE_CREATED = "MaintenanceCreated"
    FUEL_LOGGED = "FuelLogged"
    DRIVER_LICENSE_EXPIRING = "DriverLicenseExpiring"
    EXPENSE_LOGGED = "ExpenseLogged"
