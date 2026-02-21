"""FleetFlow – SQLAlchemy ORM models."""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, Date, DateTime,
    ForeignKey, Index, Enum as SAEnum, Numeric,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


# ── Enums ────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    FLEET_MANAGER = "fleet_manager"
    DISPATCHER = "dispatcher"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


class TripStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    DISPATCHED = "dispatched"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class FuelType(str, enum.Enum):
    DIESEL = "diesel"
    PETROL = "petrol"
    CNG = "cng"
    ELECTRIC = "electric"


# ── Helpers ──────────────────────────────────────────────────────────────

def _uuid() -> str:
    return str(uuid.uuid4())


# ── Users ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ── Vehicles ─────────────────────────────────────────────────────────────

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    vin: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(SAEnum(FuelType), nullable=False)
    capacity_tons: Mapped[float] = mapped_column(Float, default=0)
    odometer_km: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[VehicleStatus] = mapped_column(SAEnum(VehicleStatus), default=VehicleStatus.ACTIVE)
    insurance_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    trips: Mapped[list["Trip"]] = relationship(back_populates="vehicle")
    maintenance_logs: Mapped[list["MaintenanceLog"]] = relationship(back_populates="vehicle")
    fuel_logs: Mapped[list["FuelLog"]] = relationship(back_populates="vehicle")


# ── Drivers ──────────────────────────────────────────────────────────────

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[DriverStatus] = mapped_column(SAEnum(DriverStatus), default=DriverStatus.AVAILABLE)
    total_trips: Mapped[int] = mapped_column(Integer, default=0)
    safety_score: Mapped[float] = mapped_column(Float, default=100.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    trips: Mapped[list["Trip"]] = relationship(back_populates="driver")


# ── Trips ────────────────────────────────────────────────────────────────

class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    trip_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    driver_id: Mapped[str] = mapped_column(ForeignKey("drivers.id"), nullable=False, index=True)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, default=0)
    cargo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cargo_weight_tons: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[TripStatus] = mapped_column(SAEnum(TripStatus), default=TripStatus.SCHEDULED, index=True)
    scheduled_departure: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scheduled_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_departure: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fuel_consumed_liters: Mapped[float] = mapped_column(Float, default=0)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    dispatched_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="trips")
    driver: Mapped["Driver"] = relationship(back_populates="trips")

    __table_args__ = (
        Index("ix_trips_status_scheduled", "status", "scheduled_departure"),
    )


# ── Maintenance ──────────────────────────────────────────────────────────

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    maintenance_type: Mapped[str] = mapped_column(String(100), nullable=False)  # preventive, corrective, emergency
    status: Mapped[MaintenanceStatus] = mapped_column(SAEnum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    odometer_at_service: Mapped[float] = mapped_column(Float, default=0)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    performed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_logs")


# ── Fuel & Expense Logs ─────────────────────────────────────────────────

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    fuel_type: Mapped[FuelType] = mapped_column(SAEnum(FuelType), nullable=False)
    quantity_liters: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_liter: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    odometer_reading: Mapped[float] = mapped_column(Float, nullable=False)
    station_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="fuel_logs")


# ── Automation: Notifications ─────────────────────────────────────────────

class NotificationType(str, enum.Enum):
    SAFETY = "safety"
    FINANCIAL = "financial"
    MAINTENANCE = "maintenance"
    COMPLIANCE = "compliance"
    OPERATIONAL = "operational"


class NotificationSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType), nullable=False, index=True)
    severity: Mapped[NotificationSeverity] = mapped_column(SAEnum(NotificationSeverity), default=NotificationSeverity.INFO)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)   # "driver", "vehicle", "trip"
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


# ── Automation: Domain Events ─────────────────────────────────────────────

class DomainEvent(Base):
    __tablename__ = "domain_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    payload: Mapped[str] = mapped_column(Text, nullable=False)   # JSON string
    triggered_by: Mapped[str | None] = mapped_column(String(36), nullable=True)   # user_id
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


# ── Automation: Analytics Summary ─────────────────────────────────────────

class AnalyticsSummary(Base):
    __tablename__ = "analytics_summary"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    vehicle_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)  # NULL = fleet-wide
    total_fuel_cost: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_maintenance_cost: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_operational_cost: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_trips: Mapped[int] = mapped_column(Integer, default=0)
    total_distance_km: Mapped[float] = mapped_column(Float, default=0)
    avg_fuel_efficiency: Mapped[float] = mapped_column(Float, default=0)  # km per litre
    predicted_next_service_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_next_service_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_analytics_period_vehicle", "period_year", "period_month", "vehicle_id", unique=True),
    )


# ── Automation: Logs ──────────────────────────────────────────────────────

class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    job_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # success, error, skipped
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    ran_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
