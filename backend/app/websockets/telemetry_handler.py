from __future__ import annotations
import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from jose import JWTError
from app.core import security as sec
from app.models.biometric import BiometricSnapshot
from app.models.user import User
from app.schemas.biometric import BiometricIngest
from app.services.burnout_engine import burnout_engine

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self._active: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self._active.setdefault(user_id, []).append(websocket)
        logger.info(f"WS connected: user={user_id}, total={self._count()}")

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        connections = self._active.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self._active.pop(user_id, None)
        logger.info(f"WS disconnected: user={user_id}, total={self._count()}")

    async def send_json(self, websocket: WebSocket, data: dict) -> None:
        await websocket.send_json(data)

    def _count(self) -> int:
        return sum(len(v) for v in self._active.values())


manager = ConnectionManager()


async def telemetry_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time biometric telemetry streaming.
    Protocol:
      1. Client sends: {"token": "<JWT>"}
      2. Server responds: {"status": "authenticated", "user": "<username>"}
      3. Client sends BiometricIngest JSON frames.
      4. Server responds with BurnoutRiskResult JSON frames.
    """
    await websocket.accept()
    user_id = "unknown"

    try:
        # Step 1: Auth handshake
        raw = await websocket.receive_text()
        auth_data = json.loads(raw)
        token = auth_data.get("token", "")

        try:
            payload = sec.decode_token(token)
            username = payload.get("sub", "guest")
            role = payload.get("role", "guest")
        except JWTError:
            await websocket.send_json({"error": "Invalid token. Connection closed."})
            await websocket.close(code=4001)
            return

        user_id = username
        mock_user = User(
            id=0,
            username=username,
            role=role,
            is_active=True,
            is_guest=(role == "guest"),
        )

        await websocket.send_json({"status": "authenticated", "user": username, "role": role})
        logger.info(f"WS authenticated: user={username}")

        # Step 2: Stream loop
        while True:
            raw_frame = await websocket.receive_text()
            try:
                frame_data = json.loads(raw_frame)
                ingest = BiometricIngest(**frame_data)
            except Exception as e:
                await websocket.send_json({"error": f"Invalid frame: {str(e)}"})
                continue

            snapshot = BiometricSnapshot(
                user_id=0,
                **ingest.model_dump(exclude_none=True),
            )
            risk = burnout_engine.compute(snapshot, baseline=None)
            await websocket.send_json(risk.model_dump())

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WS error for user={user_id}: {e}")
        try:
            await websocket.send_json({"error": "Internal server error"})
            await websocket.close(code=1011)
        except Exception:
            pass
