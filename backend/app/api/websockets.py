import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/monitor")
async def websocket_monitor(websocket: WebSocket):
    """
    WebSocket endpoint for live HUD telemetry.
    Pushes simulated realistic real-time biometric and environmental data to the connected frontend.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Generate simulated telemetry data
            telemetry = {
                "heartRate": int(random.gauss(68, 5)), # mean 68, stddev 5
                "hrv": random.randint(45, 60),
                "fatigueScore": round(max(0.01, min(0.99, random.gauss(0.15, 0.05))), 2),
                "attentionSpan": round(max(0.1, min(1.0, random.gauss(0.85, 0.1))), 2),
                "typingSpeed": int(random.gauss(75, 12)),
                "errorRate": round(max(0.0, random.gauss(2.5, 1.0)), 1),
                "ambientNoise": random.randint(35, 65),
                "lumens": random.randint(250, 400)
            }
            await websocket.send_text(json.dumps(telemetry))
            await asyncio.sleep(2) # Send update every 2 seconds
    except WebSocketDisconnect:
        manager.disconnect(websocket)
