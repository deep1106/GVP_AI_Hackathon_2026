// FleetFlow – TypeScript type definitions

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export type UserRole = 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface Vehicle {
    id: string;
    registration_number: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    fuel_type: FuelType;
    capacity_tons: number;
    odometer_km: number;
    status: VehicleStatus;
    insurance_expiry: string | null;
    created_at: string;
    updated_at: string;
}

export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export type FuelType = 'diesel' | 'petrol' | 'cng' | 'electric';

export interface Driver {
    id: string;
    employee_id: string;
    full_name: string;
    phone: string;
    email: string | null;
    license_number: string;
    license_expiry: string;
    status: DriverStatus;
    total_trips: number;
    safety_score: number;
    created_at: string;
    updated_at: string;
}

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';

export interface Trip {
    id: string;
    trip_number: string;
    vehicle_id: string;
    driver_id: string;
    origin: string;
    destination: string;
    distance_km: number;
    cargo_description: string | null;
    cargo_weight_tons: number;
    status: TripStatus;
    scheduled_departure: string;
    scheduled_arrival: string | null;
    actual_departure: string | null;
    actual_arrival: string | null;
    fuel_consumed_liters: number;
    cost: number;
    notes: string | null;
    dispatched_by: string | null;
    created_at: string;
    updated_at: string;
}

export type TripStatus = 'scheduled' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceLog {
    id: string;
    vehicle_id: string;
    description: string;
    maintenance_type: string;
    status: MaintenanceStatus;
    cost: number;
    odometer_at_service: number;
    scheduled_date: string;
    completed_date: string | null;
    performed_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export interface FuelLog {
    id: string;
    vehicle_id: string;
    date: string;
    fuel_type: FuelType;
    quantity_liters: number;
    price_per_liter: number;
    total_cost: number;
    odometer_reading: number;
    station_name: string | null;
    receipt_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DashboardKPIs {
    total_vehicles: number;
    active_vehicles: number;
    total_drivers: number;
    available_drivers: number;
    total_trips: number;
    completed_trips: number;
    in_progress_trips: number;
    total_fuel_cost: number;
    total_maintenance_cost: number;
    avg_safety_score: number;
    fleet_utilization_pct: number;
    on_time_delivery_pct: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
