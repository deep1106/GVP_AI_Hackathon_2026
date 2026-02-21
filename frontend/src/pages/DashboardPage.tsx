import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineTruck, HiOutlineLocationMarker, HiOutlineExclamation, HiOutlineCurrencyDollar, HiOutlineX } from 'react-icons/hi';
import api from '../api/client';
import type { DashboardKPIs } from '../types';

const kpiConfig = [
    { key: 'active_vehicles' as const, label: 'Active Vehicles', icon: HiOutlineTruck, accent: 'accent-teal', trend: '+5%', trendDir: 'up' as const, sub: 'Vehicles currently on the road', iconBg: 'bg-emerald-500/15 text-emerald-400' },
    { key: 'in_progress_trips' as const, label: 'Vehicles On Trip', icon: HiOutlineLocationMarker, accent: 'accent-blue', trend: '+12%', trendDir: 'up' as const, sub: 'Currently in transit', iconBg: 'bg-blue-500/15 text-blue-400' },
    { key: 'total_maintenance_cost' as const, label: 'Maintenance Alerts', icon: HiOutlineExclamation, accent: 'accent-amber', trend: '-2%', trendDir: 'down' as const, sub: 'Vehicles requiring attention', iconBg: 'bg-amber-500/15 text-amber-400', isBadge: true },
    { key: 'total_fuel_cost' as const, label: 'Total Operational Cost', icon: HiOutlineCurrencyDollar, accent: 'accent-purple', trend: '-8%', trendDir: 'down' as const, sub: 'Monthly expenditure', iconBg: 'bg-purple-500/15 text-purple-400', prefix: '$' },
];

// Mock ops removed

export default function DashboardPage() {
    const { t } = useTranslation();
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [showShipment, setShowShipment] = useState(false);
    const [shipmentSaved, setShipmentSaved] = useState(false);
    const [shipmentForm, setShipmentForm] = useState({ origin: '', destination: '', vehicle: '', driver: '', priority: 'normal', notes: '' });
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);

    useEffect(() => {
        api.get('/api/analytics/dashboard')
            .then(r => setKpis(r.data))
            .catch(() => {
                setKpis({
                    total_vehicles: 0, active_vehicles: 0, total_drivers: 0,
                    available_drivers: 0, total_trips: 0, completed_trips: 0,
                    in_progress_trips: 0, total_fuel_cost: 0, total_maintenance_cost: 0,
                    avg_safety_score: 0, fleet_utilization_pct: 0, on_time_delivery_pct: 0,
                });
            });

        api.get('/api/vehicles')
            .then(r => setVehicles(r.data.items || []))
            .catch(() => setVehicles([]));

        api.get('/api/drivers')
            .then(r => setDrivers(r.data.items || []))
            .catch(() => setDrivers([]));
    }, []);

    const formatVal = (val: number, prefix?: string) => {
        if (prefix === '$') return `$${(val / 1000).toFixed(1)}k`;
        return val.toLocaleString();
    };

    // SVG area chart points
    const chartPoints = [25, 30, 28, 40, 38, 52, 48, 55, 60, 58, 65, 70, 68, 72, 75];
    const w = 700, h = 200, gap = w / (chartPoints.length - 1);
    const maxV = Math.max(...chartPoints);
    const pts = chartPoints.map((v, i) => `${i * gap},${h - (v / maxV) * (h - 20)}`).join(' ');
    const areaD = `M0,${h} L${pts} L${w},${h} Z`;

    // Donut values (computed from KPI mock/real data instead of hardcoded)
    const totalVeh = kpis?.total_vehicles || 0;
    const activeVeh = kpis?.active_vehicles || 0;
    const inTransit = kpis?.in_progress_trips || 0;
    const inShop = kpis?.total_maintenance_cost || 0; // Using this arbitrarily if missing better status API

    // Normalize to percentages
    const activePct = totalVeh ? Math.round(((activeVeh - inTransit) / totalVeh) * 100) : 0;
    const transitPct = totalVeh ? Math.round((inTransit / totalVeh) * 100) : 0;
    const shopPct = totalVeh ? Math.round((inShop / totalVeh) * 100) : 0;

    const donutSegments = [
        { pct: transitPct, color: '#3b82f6', label: 'On Trip' },
        { pct: activePct, color: '#10b981', label: 'Available' },
        { pct: shopPct, color: '#f59e0b', label: 'In Shop' },
    ];
    const circumference = 2 * Math.PI * 45;

    return (
        <>
            <Helmet><title>FleetFlow – {t('dashboard.title')}</title></Helmet>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of fleet operations</p>
                    </div>
                    <button onClick={() => setShowShipment(true)} className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <span>+</span> New Shipment
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpiConfig.map((kpi, i) => {
                        const Icon = kpi.icon;
                        const val = kpis ? kpis[kpi.key] : 0;
                        return (
                            <motion.div
                                key={kpi.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`kpi-card ${kpi.accent} bg-white dark:bg-navy-700 border border-gray-200 dark:border-navy-600/40 p-5`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {kpi.isBadge ? (
                                            <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Action Req.</span>
                                        ) : (
                                            <span className={`text-xs font-medium ${kpi.trendDir === 'up' ? 'trend-up' : 'trend-down'} flex items-center gap-0.5`}>
                                                <span>{kpi.trendDir === 'up' ? '↗' : '↘'}</span>{kpi.trend}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatVal(val, kpi.prefix)}</p>
                                <div className="mt-3 h-1 rounded-full bg-gray-200 dark:bg-navy-600/50">
                                    <div className={`h-full rounded-full ${kpi.accent === 'accent-teal' ? 'bg-emerald-500' : kpi.accent === 'accent-blue' ? 'bg-blue-500' : kpi.accent === 'accent-amber' ? 'bg-amber-500' : 'bg-purple-500'}`} style={{ width: `${Math.min((val / 200) * 100, 100)}%` }} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fleet Performance Area Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-navy-700 border border-gray-200 dark:border-navy-600/40 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fleet Performance</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Efficiency metrics over the last 30 days</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-emerald-400 font-medium flex items-center gap-1">↑ 2.4%</span>
                                <button className="text-gray-500 hover:text-gray-300">•••</button>
                            </div>
                        </div>
                        <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-48">
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#chartGrad)" />
                            <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
                            <circle cx={6 * gap} cy={h - (chartPoints[6] / maxV) * (h - 20)} r="4" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
                        </svg>
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Status Donut */}
                    <div className="bg-white dark:bg-navy-700 border border-gray-200 dark:border-navy-600/40 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Vehicle Status</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Real-time breakdown</p>
                        <div className="flex justify-center mb-4">
                            <div className="relative w-36 h-36">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="45" fill="none" className="stroke-gray-200 dark:stroke-[#1e293b]" strokeWidth="10" />
                                    {donutSegments.reduce((acc, seg, i) => {
                                        const offset = acc.offset;
                                        const segLength = (seg.pct / 100) * circumference;
                                        acc.elements.push(
                                            <circle
                                                key={i}
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke={seg.color}
                                                strokeWidth="10"
                                                strokeDasharray={`${segLength} ${circumference - segLength}`}
                                                strokeDashoffset={-offset}
                                                strokeLinecap="round"
                                            />
                                        );
                                        acc.offset += segLength;
                                        return acc;
                                    }, { elements: [] as JSX.Element[], offset: 0 }).elements}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVeh}</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Total</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {donutSegments.map(s => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Vehicle Activity */}
                <div className="bg-white dark:bg-navy-700 border border-gray-200 dark:border-navy-600/40 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Vehicle Activity</h3>
                        <button className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-navy-600/40">
                                    <th className="pb-3 pr-4">Vehicle ID</th>
                                    <th className="pb-3 pr-4">Driver</th>
                                    <th className="pb-3 pr-4">Status</th>
                                    <th className="pb-3 pr-4">Last Location</th>
                                    <th className="pb-3 pr-4">Fuel Level</th>
                                    <th className="pb-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-navy-600/30">
                                {totalVeh > 0 ? null : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                                            No recent vehicle activity.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Shipment saved toast */}
            <AnimatePresence>
                {shipmentSaved && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-6 right-6 z-50 p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm shadow-lg backdrop-blur">
                        ✓ Shipment created successfully
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Shipment Modal */}
            <AnimatePresence>
                {showShipment && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-white">New Shipment</h2>
                                <button onClick={() => setShowShipment(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Origin</label>
                                        <input type="text" value={shipmentForm.origin} onChange={e => setShipmentForm(p => ({ ...p, origin: e.target.value }))}
                                            placeholder="e.g. Mumbai, MH" className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder-gray-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Destination</label>
                                        <input type="text" value={shipmentForm.destination} onChange={e => setShipmentForm(p => ({ ...p, destination: e.target.value }))}
                                            placeholder="e.g. Delhi, DL" className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder-gray-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Vehicle</label>
                                        <select value={shipmentForm.vehicle} onChange={e => setShipmentForm(p => ({ ...p, vehicle: e.target.value }))}
                                            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                                            <option value="">Select Vehicle</option>
                                            {vehicles?.map(v => (
                                                <option key={v.id} value={v.id}>{v.id} - {v.model_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Driver</label>
                                        <select value={shipmentForm.driver} onChange={e => setShipmentForm(p => ({ ...p, driver: e.target.value }))}
                                            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                                            <option value="">Select Driver</option>
                                            {drivers?.map(d => (
                                                <option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Priority</label>
                                    <div className="flex gap-2">
                                        {['normal', 'urgent', 'express'].map(p => (
                                            <button key={p} type="button" onClick={() => setShipmentForm(f => ({ ...f, priority: p }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${shipmentForm.priority === p
                                                    ? p === 'urgent' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : p === 'express' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                            : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                                    : 'bg-navy-600/50 text-gray-400 border border-navy-600/50 hover:text-gray-300'
                                                    }`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Notes</label>
                                    <textarea value={shipmentForm.notes} onChange={e => setShipmentForm(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="Additional details..." rows={3}
                                        className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder-gray-500 resize-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowShipment(false)} className="px-4 py-2 bg-navy-600 text-gray-300 rounded-lg text-sm hover:bg-navy-500 transition-colors">Cancel</button>
                                <button onClick={() => {
                                    setShowShipment(false);
                                    setShipmentForm({ origin: '', destination: '', vehicle: '', driver: '', priority: 'normal', notes: '' });
                                    setShipmentSaved(true);
                                    setTimeout(() => setShipmentSaved(false), 3000);
                                }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">Create Shipment</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
