import api from './client';
import type { TokenResponse, LoginRequest, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, DashboardKPIs, PaginatedResponse } from '../types';

// Auth
export const authApi = {
    login: (data: LoginRequest) => api.post<TokenResponse>('/auth/login', data),
    me: () => api.get<User>('/auth/me'),
    register: (data: { email: string; password: string; full_name: string; role: string }) =>
        api.post<User>('/auth/register', data),
};

// Vehicles
export const vehicleApi = {
    list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<Vehicle>>('/vehicles', { params }),
    get: (id: string) => api.get<Vehicle>(`/vehicles/${id}`),
    create: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data),
    update: (id: string, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data),
    delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Drivers
export const driverApi = {
    list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<Driver>>('/drivers', { params }),
    get: (id: string) => api.get<Driver>(`/drivers/${id}`),
    create: (data: Partial<Driver>) => api.post<Driver>('/drivers', data),
    update: (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data),
    delete: (id: string) => api.delete(`/drivers/${id}`),
};

// Trips
export const tripApi = {
    list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<Trip>>('/trips', { params }),
    get: (id: string) => api.get<Trip>(`/trips/${id}`),
    create: (data: Partial<Trip>) => api.post<Trip>('/trips', data),
    update: (id: string, data: Partial<Trip>) => api.put<Trip>(`/trips/${id}`, data),
};

// Maintenance
export const maintenanceApi = {
    list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<MaintenanceLog>>('/maintenance', { params }),
    create: (data: Partial<MaintenanceLog>) => api.post<MaintenanceLog>('/maintenance', data),
    update: (id: string, data: Partial<MaintenanceLog>) => api.put<MaintenanceLog>(`/maintenance/${id}`, data),
};

// Fuel
export const fuelApi = {
    list: (params?: Record<string, unknown>) => api.get<PaginatedResponse<FuelLog>>('/fuel', { params }),
    create: (data: Partial<FuelLog>) => api.post<FuelLog>('/fuel', data),
    update: (id: string, data: Partial<FuelLog>) => api.put<FuelLog>(`/fuel/${id}`, data),
    delete: (id: string) => api.delete(`/fuel/${id}`),
};

// Analytics
export const analyticsApi = {
    dashboard: () => api.get<DashboardKPIs>('/analytics/dashboard'),
};
