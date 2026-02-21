/**
 * FleetFlow – Automation Insights Page
 * Shows: KPI cards, analytics summaries, automation logs, active notifications by type.
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeContext';

const API = 'http://localhost:8000/api';

interface AnalyticsSummary {
    id: string;
    period_year: number;
    period_month: number;
    vehicle_id?: string;
    total_fuel_cost: number;
    total_maintenance_cost: number;
    total_operational_cost: number;
    total_trips: number;
    total_distance_km: number;
    avg_fuel_efficiency: number;
    predicted_next_service_km?: number;
    predicted_next_service_date?: string;
    updated_at: string;
}

interface AutomationLog {
    id: string;
    job_name: string;
    status: 'success' | 'error' | 'skipped';
    records_processed: number;
    error_message?: string;
    duration_ms: number;
    ran_at: string;
}

interface Notification {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const statusColor: Record<string, string> = {
    success: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    error: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    skipped: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400',
};

const severityBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const typeEmoji: Record<string, string> = {
    safety: '🛡️', financial: '💸', maintenance: '🔧', compliance: '📋', operational: '⚙️',
};

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div className={`rounded-xl p-5 border shadow-sm ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
    );
}

export default function AutomationInsightsPage() {
    const { token } = useAuth();
    const { dark } = useTheme();
    const [summary, setSummary] = useState<AnalyticsSummary[]>([]);
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'kpis' | 'logs' | 'alerts'>('kpis');

    const headers = { Authorization: `Bearer ${token}` };
    const now = new Date();

    const fetchAll = useCallback(async () => {
        try {
            const [sRes, lRes, nRes] = await Promise.all([
                fetch(`${API}/notifications/analytics-summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, { headers }),
                fetch(`${API}/notifications/automation-logs?page_size=20`, { headers }),
                fetch(`${API}/notifications?page_size=30`, { headers }),
            ]);
            if (sRes.ok) setSummary((await sRes.json()).items ?? []);
            if (lRes.ok) setLogs((await lRes.json()).items ?? []);
            if (nRes.ok) setNotifications((await nRes.json()).items ?? []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const fleetSummary = summary.find(s => !s.vehicle_id);
    const vehicleSummaries = summary.filter(s => s.vehicle_id);

    const debugTrigger = async (endpoint: string) => {
        await fetch(`${API}/notifications/debug/${endpoint}`, { method: 'POST', headers });
        setTimeout(fetchAll, 2000);
    };

    const tabs = ['kpis', 'logs', 'alerts'] as const;

    return (
        <>
            <Helmet>
                <title>Automation Insights – FleetFlow</title>
            </Helmet>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">⚡ Automation Insights</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time automation events, predictions & cost analytics</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => debugTrigger('run-license-check')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        >
                            🔍 Run License Check
                        </button>
                        <button
                            onClick={() => debugTrigger('run-maintenance-check')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-blue-400 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            🔧 Run Maintenance Check
                        </button>
                        <button
                            onClick={fetchAll}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                {/* Fleet-wide KPIs */}
                {fleetSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard
                            label="Monthly Fuel Cost"
                            value={`₹${Number(fleetSummary.total_fuel_cost).toLocaleString('en-IN')}`}
                            color="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-900 dark:text-orange-100"
                        />
                        <KPICard
                            label="Maintenance Cost"
                            value={`₹${Number(fleetSummary.total_maintenance_cost).toLocaleString('en-IN')}`}
                            color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100"
                        />
                        <KPICard
                            label="Total Operational"
                            value={`₹${Number(fleetSummary.total_operational_cost).toLocaleString('en-IN')}`}
                            color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100"
                        />
                        <KPICard
                            label="Active Alerts"
                            value={notifications.filter(n => !n.is_read).length}
                            sub="unread notifications"
                            color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-900 dark:text-red-100"
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className={`rounded-xl border ${dark ? 'bg-navy-800 border-navy-600/30' : 'bg-white border-gray-200'} overflow-hidden`}>
                    <div className="flex border-b border-gray-200 dark:border-navy-600/30">
                        {tabs.map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${activeTab === t
                                        ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {t === 'kpis' ? '📊 Per-Vehicle Analytics' : t === 'logs' ? '📋 Automation Logs' : '🔔 Alert Feed'}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Loading automation data…</div>
                        ) : (
                            <>
                                {/* Per-vehicle analytics */}
                                {activeTab === 'kpis' && (
                                    <div className="overflow-x-auto">
                                        {vehicleSummaries.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No per-vehicle analytics yet. Log fuel or maintenance to trigger calculations.</p>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-navy-600/30">
                                                        <th className="pb-3 pr-4">Vehicle</th>
                                                        <th className="pb-3 pr-4">Fuel Cost</th>
                                                        <th className="pb-3 pr-4">Maint. Cost</th>
                                                        <th className="pb-3 pr-4">Efficiency</th>
                                                        <th className="pb-3 pr-4">Trips</th>
                                                        <th className="pb-3">Next Service</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-navy-700/40">
                                                    {vehicleSummaries.map(s => (
                                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/20">
                                                            <td className="py-3 pr-4 font-mono text-xs text-gray-600 dark:text-gray-300">{s.vehicle_id?.slice(0, 8)}…</td>
                                                            <td className="py-3 pr-4">₹{Number(s.total_fuel_cost).toLocaleString('en-IN')}</td>
                                                            <td className="py-3 pr-4">₹{Number(s.total_maintenance_cost).toLocaleString('en-IN')}</td>
                                                            <td className="py-3 pr-4">{s.avg_fuel_efficiency.toFixed(2)} km/L</td>
                                                            <td className="py-3 pr-4">{s.total_trips}</td>
                                                            <td className="py-3 text-xs">
                                                                {s.predicted_next_service_date ? (
                                                                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                        {s.predicted_next_service_date}
                                                                    </span>
                                                                ) : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* Automation logs */}
                                {activeTab === 'logs' && (
                                    <div className="space-y-2">
                                        {logs.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No automation jobs have run yet.</p>
                                        ) : (
                                            logs.map(log => (
                                                <div key={log.id} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${dark ? 'border-navy-600/30 bg-navy-700/20' : 'border-gray-100 bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[log.status]}`}>
                                                            {log.status}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.job_name.replace(/_/g, ' ')}</p>
                                                            {log.error_message && (
                                                                <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{log.error_message}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400">
                                                        <p>{log.records_processed} records</p>
                                                        <p>{log.duration_ms}ms · {new Date(log.ran_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Alert feed */}
                                {activeTab === 'alerts' && (
                                    <div className="space-y-2">
                                        {notifications.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No alerts generated yet.</p>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`flex gap-4 px-4 py-3 rounded-lg border ${n.is_read ? '' : 'ring-1 ring-primary-400/30'} ${dark ? 'border-navy-600/30 bg-navy-700/20' : 'border-gray-100 bg-gray-50'}`}>
                                                    <span className="text-xl">{typeEmoji[n.type] || '🔔'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${severityBadge[n.severity] || ''}`}>
                                                                {n.severity}
                                                            </span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-600 text-gray-500 capitalize">{n.type}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                                        {new Date(n.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
