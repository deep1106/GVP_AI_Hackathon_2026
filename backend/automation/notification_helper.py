"""FleetFlow – Reusable helper to create and broadcast notifications."""

import json
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import Notification, NotificationType, NotificationSeverity
from automation.ws_manager import ws_manager

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    *,
    type: NotificationType,
    severity: NotificationSeverity,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> Notification:
    """Persist a notification and broadcast it via WebSocket."""
    notif = Notification(
        type=type,
        severity=severity,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    # Broadcast to all connected WS clients
    try:
        await ws_manager.broadcast_notification({
            "event": "new_notification",
            "id": notif.id,
            "type": notif.type.value,
            "severity": notif.severity.value,
            "title": notif.title,
            "message": notif.message,
            "entity_type": notif.entity_type,
            "entity_id": notif.entity_id,
            "created_at": notif.created_at.isoformat(),
        })
    except Exception as exc:
        logger.warning(f"WS broadcast failed: {exc}")

    return notif
