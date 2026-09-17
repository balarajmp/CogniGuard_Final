from __future__ import annotations
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.db.session import init_db

# Import all models so SQLAlchemy can register them for table creation
import app.db.base  # noqa: F401

# Route modules
from app.api.v1 import auth, biometrics, interventions, enterprise, insights, copilot, focus, achievements, ml_dataset, admin, recovery
from app.websockets.telemetry_handler import telemetry_endpoint

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} [{settings.ENVIRONMENT}]")
    await init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Privacy-first Cognitive Load & Burnout Detection Platform",
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- CORS ---
# IMPORTANT: Never mix allow_origins=["*"] with allow_credentials=True —
# browsers will reject the preflight. Use a strict explicit list instead.
_cors_origins = list({
    *settings.cors_origins,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
PREFIX = settings.API_V1_STR
app.include_router(auth.router, prefix=f"{PREFIX}/auth", tags=["Authentication"])
app.include_router(biometrics.router, prefix=f"{PREFIX}/biometrics", tags=["Biometrics"])
app.include_router(interventions.router, prefix=f"{PREFIX}/interventions", tags=["Interventions"])
app.include_router(enterprise.router, prefix=f"{PREFIX}/enterprise", tags=["Enterprise"])
app.include_router(insights.router, prefix=f"{PREFIX}/insights", tags=["AI Insights"])
app.include_router(copilot.router, prefix=f"{PREFIX}/copilot", tags=["Cognitive Copilot"])
app.include_router(focus.router, prefix=f"{PREFIX}/focus", tags=["Focus Scheduler"])
app.include_router(achievements.router, prefix=f"{PREFIX}/achievements", tags=["Achievements"])
app.include_router(ml_dataset.router, prefix=f"{PREFIX}/ml/dataset", tags=["ML Dataset"])
app.include_router(admin.router, prefix=f"{PREFIX}/admin", tags=["Admin Control Panel"])
app.include_router(recovery.router, prefix=f"{PREFIX}/recovery", tags=["Recovery Tracking"])


# --- WebSocket ---
@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket) -> None:
    await telemetry_endpoint(websocket)


# --- Health Check ---
@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok", "version": settings.API_VERSION, "env": settings.ENVIRONMENT}


@app.get("/", tags=["Health"])
async def root() -> dict:
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health",
    }
