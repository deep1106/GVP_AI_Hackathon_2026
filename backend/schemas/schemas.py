"""FleetFlow – Pydantic schemas."""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional
from models.models import (
    UserRole, VehicleStatus, DriverStatus, TripStatus,
    MaintenanceStatus, FuelType,
)


# ── Auth ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)
    role: UserRole


# ── User ─────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Vehicle ──────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=1, max_length=50)
    make: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1900, le=2100)
    vin: str = Field(min_length=1, max_length=50)
    fuel_type: FuelType
    capacity_tons: float = Field(ge=0, default=0)
    odometer_km: float = Field(ge=0, default=0)
    status: VehicleStatus = VehicleStatus.ACTIVE
    insurance_expiry: Optional[date] = None


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: Optional[FuelType] = None
    capacity_tons: Optional[float] = None
    odometer_km: Optional[float] = None
    status: Optional[VehicleStatus] = None
    insurance_expiry: Optional[date] = None


class VehicleOut(BaseModel):
    id: str
    registration_number: str
    make: str
    model: str
    year: int
    vin: str
    fuel_type: FuelType
    capacity_tons: float
    odometer_km: float
    status: VehicleStatus
    insurance_expiry: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Driver ───────────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    employee_id: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=20)
    email: Optional[str] = None
    license_number: str = Field(min_length=1, max_length=50)
    license_expiry: date
    status: DriverStatus = DriverStatus.AVAILABLE


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    license_expiry: Optional[date] = None
    status: Optional[DriverStatus] = None
    safety_score: Optional[float] = None


class DriverOut(BaseModel):
    id: str
    employee_id: str
    full_name: str
    phone: str
    email: Optional[str]
    license_number: str
    license_expiry: date
    status: DriverStatus
    total_trips: int
    safety_score: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Trip ─────────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    vehicle_id: str
    driver_id: str
    origin: str = Field(min_length=1, max_length=255)
    destination: str = Field(min_length=1, max_length=255)
    distance_km: float = Field(ge=0, default=0)
    cargo_description: Optional[str] = None
    cargo_weight_tons: float = Field(ge=0, default=0)
    scheduled_departure: datetime
    scheduled_arrival: Optional[datetime] = None
    cost: float = Field(ge=0, default=0)
    notes: Optional[str] = None


class TripUpdate(BaseModel):
    status: Optional[TripStatus] = None
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    fuel_consumed_liters: Optional[float] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
    distance_km: Optional[float] = None


class TripOut(BaseModel):
    id: str
    trip_number: str
    vehicle_id: str
    driver_id: str
    origin: str
    destination: str
    distance_km: float
    cargo_description: Optional[str]
    cargo_weight_tons: float
    status: TripStatus
    scheduled_departure: datetime
    scheduled_arrival: Optional[datetime]
    actual_departure: Optional[datetime]
    actual_arrival: Optional[datetime]
    fuel_consumed_liters: float
    cost: float
    notes: Optional[str]
    dispatched_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Maintenance ──────────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str = Field(min_length=1)
    maintenance_type: str = Field(min_length=1, max_length=100)
    cost: float = Field(ge=0, default=0)
    odometer_at_service: float = Field(ge=0, default=0)
    scheduled_date: date
    performed_by: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    cost: Optional[float] = None
    completed_date: Optional[date] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceOut(BaseModel):
    id: str
    vehicle_id: str
    description: str
    maintenance_type: str
    status: MaintenanceStatus
    cost: float
    odometer_at_service: float
    scheduled_date: date
    completed_date: Optional[date]
    performed_by: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Fuel & Expense ───────────────────────────────────────────────────────

class FuelLogCreate(BaseModel):
    vehicle_id: str
    date: date
    fuel_type: FuelType
    quantity_liters: float = Field(gt=0)
    price_per_liter: float = Field(gt=0)
    total_cost: float = Field(ge=0)
    odometer_reading: float = Field(ge=0)
    station_name: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None


class FuelLogUpdate(BaseModel):
    quantity_liters: Optional[float] = None
    price_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    station_name: Optional[str] = None
    notes: Optional[str] = None


class FuelLogOut(BaseModel):
    id: str
    vehicle_id: str
    date: date
    fuel_type: FuelType
    quantity_liters: float
    price_per_liter: float
    total_cost: float
    odometer_reading: float
    station_name: Optional[str]
    receipt_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Analytics ────────────────────────────────────────────────────────────

class DashboardKPIs(BaseModel):
    total_vehicles: int = 0
    active_vehicles: int = 0
    total_drivers: int = 0
    available_drivers: int = 0
    total_trips: int = 0
    completed_trips: int = 0
    in_progress_trips: int = 0
    total_fuel_cost: float = 0
    total_maintenance_cost: float = 0
    avg_safety_score: float = 0
    fleet_utilization_pct: float = 0
    on_time_delivery_pct: float = 0


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Automation: Notifications ────────────────────────────────────────────

from models.models import NotificationType, NotificationSeverity  # noqa: E402


class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    severity: NotificationSeverity
    title: str
    message: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Automation: Analytics Summary ───────────────────────────────────────

class AnalyticsSummaryOut(BaseModel):
    id: str
    period_year: int
    period_month: int
    vehicle_id: Optional[str]
    total_fuel_cost: float
    total_maintenance_cost: float
    total_operational_cost: float
    total_trips: int
    total_distance_km: float
    avg_fuel_efficiency: float
    predicted_next_service_km: Optional[float]
    predicted_next_service_date: Optional[date]
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Automation: Automation Logs ─────────────────────────────────────────

class AutomationLogOut(BaseModel):
    id: str
    job_name: str
    status: str
    records_processed: int
    error_message: Optional[str]
    duration_ms: int
    ran_at: datetime

    model_config = {"from_attributes": True}

