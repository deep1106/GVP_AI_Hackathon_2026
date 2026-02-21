"""FleetFlow – Smart Dispatch Validator.

Pre-flight checks before a trip is dispatched.
Returns a list of validation errors so the caller can decide how to proceed.
"""

from datetime import date
from dataclasses import dataclass, field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import Driver, Vehicle, Trip, TripStatus, DriverStatus, VehicleStatus


@dataclass
class ValidationResult:
    is_valid: bool = True
    errors: list[str] = field(default_factory=list)

    def add_error(self, msg: str):
        self.is_valid = False
        self.errors.append(msg)


async def validate_dispatch(
    db: AsyncSession,
    vehicle_id: str,
    driver_id: str,
    cargo_weight_tons: float = 0,
) -> ValidationResult:
    """
    Runs all pre-dispatch validation checks.
    Returns a ValidationResult with is_valid=False and a list of errors
    if anything prevents safe dispatch.
    """
    result = ValidationResult()

    # ── Load entities ────────────────────────────────────────────────────
    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id)
    )).scalar_one_or_none()

    driver = (await db.execute(
        select(Driver).where(Driver.id == driver_id)
    )).scalar_one_or_none()

    if not vehicle:
        result.add_error(f"Vehicle '{vehicle_id}' not found.")
        return result

    if not driver:
        result.add_error(f"Driver '{driver_id}' not found.")
        return result

    # ── Vehicle checks ───────────────────────────────────────────────────
    if vehicle.status != VehicleStatus.ACTIVE:
        result.add_error(
            f"Vehicle {vehicle.registration_number} is not active (status: {vehicle.status.value})."
        )

    if vehicle.capacity_tons > 0 and cargo_weight_tons > vehicle.capacity_tons:
        result.add_error(
            f"Cargo weight {cargo_weight_tons}t exceeds vehicle capacity {vehicle.capacity_tons}t."
        )

    if vehicle.insurance_expiry and vehicle.insurance_expiry < date.today():
        result.add_error(
            f"Vehicle {vehicle.registration_number} insurance expired on {vehicle.insurance_expiry}."
        )

    # ── Driver checks ────────────────────────────────────────────────────
    if driver.status == DriverStatus.SUSPENDED:
        result.add_error(
            f"Driver {driver.full_name} is suspended and cannot be dispatched."
        )
    elif driver.status != DriverStatus.AVAILABLE:
        result.add_error(
            f"Driver {driver.full_name} is not available (status: {driver.status.value})."
        )

    if driver.license_expiry < date.today():
        result.add_error(
            f"Driver {driver.full_name}'s license expired on {driver.license_expiry}. Cannot dispatch."
        )

    # ── Double-assignment check ──────────────────────────────────────────
    active_statuses = [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]
    dup = (await db.execute(
        select(Trip).where(
            Trip.status.in_(active_statuses),
            (Trip.vehicle_id == vehicle_id) | (Trip.driver_id == driver_id),
        )
    )).scalar_one_or_none()

    if dup:
        result.add_error(
            f"Vehicle or driver is already assigned to active trip {dup.trip_number}."
        )

    return result
