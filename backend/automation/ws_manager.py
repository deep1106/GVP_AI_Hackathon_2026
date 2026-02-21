"""FleetFlow – WebSocket Connection Manager for real-time notifications."""

import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages all active WebSocket connections for notification broadcasting."""

    def __init__(self):
        # Maps user_id → list of websocket connections (multiple tabs support)
        self._connections: Dict[str, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, []).append(websocket)
        logger.info(f"WS connected: user={user_id}, total_sessions={sum(len(v) for v in self._connections.values())}")

    async def disconnect(self, websocket: WebSocket, user_id: str):
        async with self._lock:
            sockets = self._connections.get(user_id, [])
            if websocket in sockets:
                sockets.remove(websocket)
            if not sockets:
                self._connections.pop(user_id, None)
        logger.info(f"WS disconnected: user={user_id}")

    async def broadcast_notification(self, payload: dict):
        """Broadcast a notification to ALL connected clients."""
        message = json.dumps(payload)
        dead: list[tuple[str, WebSocket]] = []
        async with self._lock:
            connections_snapshot = {
                uid: list(sockets)
                for uid, sockets in self._connections.items()
            }
        for uid, sockets in connections_snapshot.items():
            for ws in sockets:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append((uid, ws))
        # Clean up dead connections
        async with self._lock:
            for uid, ws in dead:
                sockets = self._connections.get(uid, [])
                if ws in sockets:
                    sockets.remove(ws)

    async def send_to_user(self, user_id: str, payload: dict):
        """Send a notification only to a specific user."""
        message = json.dumps(payload)
        async with self._lock:
            sockets = list(self._connections.get(user_id, []))
        for ws in sockets:
            try:
                await ws.send_text(message)
            except Exception:
                pass


# Singleton instance shared across the app
ws_manager = ConnectionManager()
