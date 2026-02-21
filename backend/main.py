"""FleetFlow – Main FastAPI application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import engine, Base

# Import all models so they register with Base.metadata
from models.models import (  # noqa: F401
    User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog,
    Notification, DomainEvent, AnalyticsSummary, AutomationLog,
)

from routers.auth_router import router as auth_router
from routers.vehicle_router import router as vehicle_router
from routers.driver_router import router as driver_router
from routers.trip_router import router as trip_router
from routers.maintenance_router import router as maintenance_router
from routers.fuel_router import router as fuel_router
from routers.analytics_router import router as analytics_router
from routers.notification_router import router as notification_router
from routers.websocket_router import router as websocket_router
from routers.search_router import router as search_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Register domain event handlers
    import automation.event_handlers  # noqa: F401 – registers handlers via decorators

    # Start background scheduler
    from automation.scheduler import start_scheduler, stop_scheduler
    start_scheduler()

    yield

    stop_scheduler()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Fleet & Logistics Management System with Automation",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(driver_router)
app.include_router(trip_router)
app.include_router(maintenance_router)
app.include_router(fuel_router)
app.include_router(analytics_router)
app.include_router(notification_router)
app.include_router(websocket_router)
app.include_router(search_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": "2.0.0"}

