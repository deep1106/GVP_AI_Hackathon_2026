import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDownload, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';

const financialData: any[] = [];

const statusBadge: Record<string, string> = {
    Audited: 'bg-emerald-500/15 text-emerald-400',
    Pending: 'bg-amber-500/15 text-amber-400',
    Processing: 'bg-blue-500/15 text-blue-400',
    Active: 'bg-purple-500/15 text-purple-400',
};

const topVehicles: any[] = [];

const trendPts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [exported, setExported] = useState(false);

    const w = 600, h = 160;
    const gap = w / (trendPts.length - 1);
    const maxV = Math.max(...trendPts, 1);
    const pts = trendPts.map((v, i) => `${i * gap},${h - (v / maxV) * (h - 15)}`).join(' ');
    const areaD = `M0,${h} L${pts} L${w},${h} Z`;

    // Filter logic
    const filteredData = financialData.filter(row => {
        if (filterStatus !== 'all' && row.status !== filterStatus) return false;
        if (filterMonth !== 'all' && row.month !== filterMonth) return false;
        return true;
    });

    // Export to CSV
    const handleExport = () => {
        const headers = ['Month', 'Revenue', 'Fuel Cost', 'Maintenance', 'Net Profit', 'Status'];
        const rows = filteredData.map(r => [r.month, r.revenue, r.fuel, r.maintenance, r.net, r.status]);
        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fleetflow_analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setExported(true);
        setTimeout(() => setExported(false), 3000);
    };

    return (
        <>
            <Helmet><title>FleetFlow – {t('analytics.title')}</title></Helmet>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Operational Analytics & Reports</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowFilter(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 hover:bg-navy-600/50 transition-colors">
                            <HiOutlineFilter className="w-4 h-4" /> Filter Data
                        </button>
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
                            <HiOutlineDownload className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>

                {/* Export success toast */}
                <AnimatePresence>
                    {exported && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm text-center">
                            ✓ Report exported successfully as CSV
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active filters indicator */}
                {(filterStatus !== 'all' || filterMonth !== 'all') && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Active filters:</span>
                        {filterStatus !== 'all' && (
                            <span className="bg-primary-500/15 text-primary-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                Status: {filterStatus}
                                <button onClick={() => setFilterStatus('all')} className="hover:text-white">×</button>
                            </span>
                        )}
                        {filterMonth !== 'all' && (
                            <span className="bg-primary-500/15 text-primary-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                Month: {filterMonth}
                                <button onClick={() => setFilterMonth('all')} className="hover:text-white">×</button>
                            </span>
                        )}
                        <button onClick={() => { setFilterStatus('all'); setFilterMonth('all'); }} className="text-gray-500 hover:text-gray-300 underline">Clear all</button>
                    </div>
                )}

                {/* Summary KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="kpi-card accent-red bg-navy-700 border border-navy-600/40 p-5">
                        <p className="text-xs text-gray-400 mb-1">Total Fuel Cost</p>
                        <p className="text-3xl font-bold text-white">₹0</p>
                        <div className="mt-3 h-1.5 rounded-full bg-navy-600/50">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '0%' }} />
                        </div>
                    </div>
                    <div className="kpi-card accent-teal bg-navy-700 border border-navy-600/40 p-5">
                        <p className="text-xs text-gray-400 mb-1">Fleet ROI</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-white">0%</p>
                            <span className="text-xs text-gray-400 font-medium">-</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-navy-600/50">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: '0%' }} />
                        </div>
                    </div>
                    <div className="kpi-card accent-blue bg-navy-700 border border-navy-600/40 p-5">
                        <p className="text-xs text-gray-400 mb-1">Utilization Rate</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-white">0%</p>
                            <span className="text-xs text-gray-400 font-medium">-</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-navy-600/50">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: '0%' }} />
                        </div>
                    </div>
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Fuel Efficiency Trend */}
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Fuel Efficiency Trend</h3>
                                <p className="text-xs text-gray-400 mt-0.5">(km/L)</p>
                            </div>
                            <span className="text-xs text-gray-400 font-medium bg-gray-500/10 px-2 py-0.5 rounded">-</span>
                        </div>
                        <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-40">
                            <defs>
                                <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#analyticsGrad)" />
                            <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Top 5 Costliest Vehicles */}
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Top 5 Costliest Vehicles</h3>
                        <div className="space-y-3.5">
                            {topVehicles.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No vehicle data available</p>
                            )}
                            {topVehicles.map((v, i) => (
                                <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-8 text-right">{v.id}</span>
                                    <div className="flex-1 h-6 rounded bg-navy-600/40 overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${v.pct}%` }}
                                            transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                                            className={`h-full rounded ${i === 0 ? 'bg-red-500/80' : i === 1 ? 'bg-amber-500/80' : 'bg-blue-500/60'}`}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 font-medium">₹{(v.cost / 1000).toFixed(1)}k</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financial Summary Table */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-navy-600/40">
                        <h3 className="text-lg font-semibold text-white">Financial Summary of Profit</h3>
                        <span className="text-xs text-gray-500">{filteredData.length} of {financialData.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-navy-600/40 bg-navy-700/50">
                                    <th className="px-5 py-3.5">Month</th>
                                    <th className="px-5 py-3.5">Revenue</th>
                                    <th className="px-5 py-3.5">Fuel Cost</th>
                                    <th className="px-5 py-3.5">Maintenance</th>
                                    <th className="px-5 py-3.5">Net Profit</th>
                                    <th className="px-5 py-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-600/30">
                                {filteredData.map((row, i) => (
                                    <motion.tr key={row.month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className="hover:bg-navy-600/20 transition-colors">
                                        <td className="px-5 py-3.5 text-sm font-medium text-white">{row.month}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-300">{row.revenue}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-300">{row.fuel}</td>
                                        <td className="px-5 py-3.5 text-sm text-gray-300">{row.maintenance}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-white">{row.net}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[row.status]}`}>{row.status}</span>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">No records match your filters</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            <AnimatePresence>
                {showFilter && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-white">Filter Data</h2>
                                <button onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <HiOutlineX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                                        <option value="all">All Statuses</option>
                                        <option value="Audited">Audited</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Active">Active</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Month</label>
                                    <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                                        <option value="all">All Months</option>
                                        {financialData.map(r => <option key={r.month} value={r.month}>{r.month}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => { setFilterStatus('all'); setFilterMonth('all'); }}
                                    className="px-4 py-2 bg-navy-600 text-gray-300 rounded-lg text-sm hover:bg-navy-500 transition-colors">Reset</button>
                                <button onClick={() => setShowFilter(false)}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">Apply Filters</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
