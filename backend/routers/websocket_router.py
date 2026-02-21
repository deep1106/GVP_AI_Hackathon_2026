"""FleetFlow – WebSocket router for real-time notifications."""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError

from config import get_settings
from automation.ws_manager import ws_manager

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def notifications_ws(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Authenticated WebSocket endpoint.
    Client connects with: ws://localhost:8000/ws/notifications?token=<JWT>
    """
    user_id = "anonymous"
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub", "anonymous")
    except JWTError:
        await websocket.close(code=4001)
        logger.warning(f"[WS] Rejected connection – invalid token")
        return

    await ws_manager.connect(websocket, user_id)
    logger.info(f"[WS] Client connected: user_id={user_id}")

    try:
        # Keep connection alive; client can send pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, user_id)
        logger.info(f"[WS] Client disconnected: user_id={user_id}")
    except Exception as exc:
        logger.error(f"[WS] Error for user={user_id}: {exc}")
        await ws_manager.disconnect(websocket, user_id)
