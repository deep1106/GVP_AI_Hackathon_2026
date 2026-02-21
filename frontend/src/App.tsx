import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LiveMapPage from './pages/LiveMapPage';
import AutomationInsightsPage from './pages/AutomationInsightsPage';

import RegisterPage from './pages/RegisterPage';

export default function App() {
    return (
        <HelmetProvider>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                                <Route index element={<Navigate to="/dashboard" replace />} />
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="vehicles" element={<VehiclesPage />} />
                                <Route path="drivers" element={<DriversPage />} />
                                <Route path="trips" element={<TripsPage />} />
                                <Route path="maintenance" element={<MaintenancePage />} />
                                <Route path="fuel" element={<FuelPage />} />
                                <Route path="analytics" element={<AnalyticsPage />} />
                                <Route path="settings" element={<SettingsPage />} />
                                <Route path="map" element={<LiveMapPage />} />
                                <Route path="automation" element={<AutomationInsightsPage />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
}
