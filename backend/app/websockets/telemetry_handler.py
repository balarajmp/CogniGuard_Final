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
from app.db.session import AsyncSessionLocal
from app.repositories.user_repo import UserRepository
from app.repositories.biometric_repo import BiometricRepository
from app.repositories.stress_repo import StressRepository
from app.services.intervention_service import InterventionService
from app.models.stress import StressHistory

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self._active: dict[str, list[WebSocket]] = {}

    def connect(self, websocket: WebSocket, user_id: str) -> None:
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
      1. Extraction of authentication token from subprotocols, query params, headers, or text handshake frame.
      2. Handshake response with authentication confirmation.
      3. Client sends BiometricIngest JSON frames.
      4. Server responds with BurnoutRiskResult JSON frames.
    """
    # Try query parameter
    token = websocket.query_params.get("token")

    # Try subprotocols
    subprotocols = websocket.scope.get("subprotocols", [])
    if not token and len(subprotocols) > 1:
        # Assuming the format is: ["cognitoshield-telemetry", "<jwt_token>"]
        token = subprotocols[1]

    # Try sec-websocket-protocol header
    if not token:
        ws_protocol = websocket.headers.get("sec-websocket-protocol")
        if ws_protocol:
            parts = [p.strip() for p in ws_protocol.split(",")]
            if len(parts) > 1:
                token = parts[1]

    # Select subprotocol to accept (browser compliance)
    accepted_protocol = None
    if subprotocols:
        accepted_protocol = subprotocols[0]

    await websocket.accept(subprotocol=accepted_protocol)
    user_id = "unknown"
    user = None

    try:
        # Step 1: Auth handshake if token was not sent in headers/URL query
        if not token:
            try:
                raw = await websocket.receive_text()
                auth_data = json.loads(raw)
                token = auth_data.get("token", "")
            except Exception:
                await websocket.send_json({"error": "Missing auth handshake token."})
                await websocket.close(code=4001)
                return

        # Decode token and authenticate
        try:
            payload = sec.decode_token(token)
            username = payload.get("sub", "guest")
            role = payload.get("role", "guest")
        except JWTError:
            await websocket.send_json({"error": "Invalid token. Connection closed."})
            await websocket.close(code=4001)
            return

        user_id = username

        # Resolve the user from database (registered vs guest)
        if role == "guest" or username == "guest":
            user = User(
                id=0,
                username="guest",
                role="guest",
                is_active=True,
                is_guest=True,
                keyboard_tracking=True,
                heart_rate_telemetry=True,
                facial_fatigue_webcam=False,
                ambient_noise_mapping=True,
                noise_multiplier=0.1
            )
        else:
            async with AsyncSessionLocal() as db:
                user_repo = UserRepository(db)
                db_user = await user_repo.get_by_username(username)
                if not db_user or not db_user.is_active:
                    await websocket.send_json({"error": "User inactive or not found"})
                    await websocket.close(code=4003)
                    return
                # Detached instance properties copy to avoid session scope binding issues outside block
                user = User(
                    id=db_user.id,
                    username=db_user.username,
                    role=db_user.role,
                    is_active=db_user.is_active,
                    is_guest=False,
                    keyboard_tracking=db_user.keyboard_tracking,
                    heart_rate_telemetry=db_user.heart_rate_telemetry,
                    facial_fatigue_webcam=db_user.facial_fatigue_webcam,
                    ambient_noise_mapping=db_user.ambient_noise_mapping,
                    noise_multiplier=db_user.noise_multiplier
                )

        manager.connect(websocket, user_id)
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
                user_id=user.id,
                **ingest.model_dump(exclude_none=True),
            )

            # Retrieve baseline in short-lived DB session
            baseline = None
            if not user.is_guest:
                async with AsyncSessionLocal() as db:
                    bio_repo = BiometricRepository(db)
                    baseline = await bio_repo.get_baseline(user.id)

            risk = burnout_engine.compute(snapshot, baseline)

            # Persist telemetry and check interventions in short-lived DB session
            if not user.is_guest:
                async with AsyncSessionLocal() as db:
                    bio_repo = BiometricRepository(db)
                    db_snapshot = BiometricSnapshot(
                        user_id=user.id,
                        **ingest.model_dump(exclude_none=True),
                    )
                    saved_snapshot = await bio_repo.create(db_snapshot)

                    stress_record = StressHistory(
                        user_id=user.id,
                        snapshot_id=saved_snapshot.id,
                        stress_level=risk.stress_level,
                        burnout_risk_pct=risk.burnout_risk_pct,
                        focus_reserves_pct=risk.focus_reserves_pct,
                        risk_tier=risk.risk_tier,
                    )
                    stress_repo = StressRepository(db)
                    await stress_repo.create(stress_record)

                    intervention_svc = InterventionService(db)
                    await intervention_svc.trigger_if_needed(user, risk, snapshot=saved_snapshot)

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
