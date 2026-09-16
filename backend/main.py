"""
Atmosense Backend — FastAPI Application Entry Point

AI-Powered Hyperlocal Severe Weather Nowcasting & Early Warning System
"""
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core import get_settings, DataMode
from backend.api.health import router as health_router
from backend.api.data import router as data_router
from backend.api.predictions import router as predictions_router
from backend.api.atmospheric import router as atmospheric_router
from backend.api.risk import router as risk_router
from backend.api.alerts import router as alerts_router
from backend.api.xai import router as xai_router
from backend.api.events import router as events_router
from backend.api.map import router as map_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Atmosense API",
        description=(
            "AI-Powered Hyperlocal Severe Weather Nowcasting & Early Warning System. "
            "Provides 2–6 hour probabilistic predictions for thunderstorms, cloudbursts, "
            "and flash floods with explainable meteorological diagnosis."
        ),
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    origins = [o.strip() for o in settings.cors_origins.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # State
    app.state.settings = settings
    app.state.start_time = datetime.now(timezone.utc)

    # Register routers
    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(data_router, prefix="/api/data", tags=["Data"])
    app.include_router(predictions_router, prefix="/api/predictions", tags=["Predictions"])
    app.include_router(atmospheric_router, prefix="/api/atmospheric", tags=["Atmospheric"])
    app.include_router(risk_router, prefix="/api/risk", tags=["Risk"])
    app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
    app.include_router(xai_router, prefix="/api/xai", tags=["XAI"])
    app.include_router(events_router, prefix="/api/events", tags=["Events"])
    app.include_router(map_router, prefix="/api/map", tags=["Map"])

    return app


app = create_app()
