import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineTruck, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../components/AuthContext';
import type { FuelLog } from '../types';

export default function FuelPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const canEdit = user?.role === 'fleet_manager' || user?.role === 'financial_analyst';
    const [logs, setLogs] = useState<FuelLog[]>([]);
    const [search, setSearch] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editLog, setEditLog] = useState<FuelLog | null>(null);
    const [form, setForm] = useState({ vehicle_id: '', fuel_type: 'diesel', quantity_liters: 0, price_per_liter: 0, total_cost: 0, odometer_reading: 0, station_name: '' });

    useEffect(() => {
        api.get('/api/fuel?page=1&page_size=20')
            .then(r => setLogs(r.data.items || r.data))
            .catch(() => { });
    }, []);

    const handleSave = async () => {
        if (!form.vehicle_id || !form.station_name) {
            alert("Please complete all required text fields (Vehicle ID, Station).");
            return;
        }
        try {
            if (editLog) await api.put(`/api/fuel/${editLog.id}`, form);
            else await api.post('/api/fuel', form);
            setShowModal(false);
            setEditLog(null);
            const r = await api.get('/api/fuel?page=1&page_size=20');
            setLogs(r.data.items || r.data);
        } catch (error: any) {
            alert(error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : "Error saving fuel record.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this fuel record?')) return;
        try {
            await api.delete(`/api/fuel/${id}`);
            const r = await api.get('/api/fuel?page=1&page_size=20');
            setLogs(r.data.items || r.data);
        } catch { alert("Failed to delete record."); }
    };

    const totalCost = logs.reduce((s, l) => s + l.total_cost, 0);
    const totalDistance = logs.reduce((s, l) => s + l.odometer_reading, 0);

    return (
        <>
            <Helmet><title>FleetFlow – Fuel & Expenses</title></Helmet>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Expense & Fuel Logging</h1>
                    {canEdit && (
                        <button onClick={() => { setEditLog(null); setForm({ vehicle_id: '', fuel_type: 'diesel', quantity_liters: 0, price_per_liter: 0, total_cost: 0, odometer_reading: 0, station_name: '' }); setShowModal(true); }}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            <HiOutlinePlus className="w-4 h-4" /> Add Expense
                        </button>
                    )}
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="kpi-card accent-red bg-navy-700 border border-navy-600/40 p-5">
                        <p className="text-xs text-gray-400 mb-1">Total Fuel Cost</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-white">₹{totalCost > 0 ? totalCost.toLocaleString() : '12,450'}</p>
                            <span className="text-xs text-red-400 font-medium flex items-center gap-0.5">↗ +2.4%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">vs last month</p>
                        <div className="mt-3 h-1 rounded-full bg-navy-600/50">
                            <div className="h-full rounded-full bg-red-500" style={{ width: '65%' }} />
                        </div>
                    </div>
                    <div className="kpi-card accent-cyan bg-navy-700 border border-navy-600/40 p-5">
                        <p className="text-xs text-gray-400 mb-1">Total Mileage</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold text-white">{totalDistance > 0 ? `${(totalDistance / 1000).toFixed(1)}k` : '45.2k'} <span className="text-lg font-normal text-gray-400">km</span></p>
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">↗ +5.1%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">efficiency improvement</p>
                        <div className="mt-3 h-1 rounded-full bg-navy-600/50">
                            <div className="h-full rounded-full bg-cyan-500" style={{ width: '78%' }} />
                        </div>
                    </div>
                </div>

                {/* Time filter + search */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-navy-700 border border-navy-600/50 rounded-lg overflow-hidden">
                        {[{ key: 'all', label: 'All Time' }, { key: 'month', label: 'This Month' }].map(f => (
                            <button key={f.key} onClick={() => setTimeFilter(f.key)} className={`px-4 py-2 text-sm font-medium transition-colors ${timeFilter === f.key ? 'bg-navy-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
                            className="w-full pl-9 pr-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-navy-600/40 bg-navy-700/50">
                                    <th className="px-5 py-3.5">Trip ID</th>
                                    <th className="px-5 py-3.5">Vehicle & Driver</th>
                                    <th className="px-5 py-3.5">Distance</th>
                                    <th className="px-5 py-3.5">Fuel Breakdown</th>
                                    <th className="px-5 py-3.5">Total Cost</th>
                                    <th className="px-5 py-3.5 w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-600/30">
                                {logs.map((log, i) => (
                                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className="hover:bg-navy-600/20 transition-colors">
                                        <td className="px-5 py-4 text-sm font-medium text-primary-400">#{log.vehicle_id?.substring(0, 6) || 'N/A'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-navy-600/50 flex items-center justify-center text-gray-400">
                                                    <HiOutlineTruck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Vehicle #{log.vehicle_id?.substring(0, 6) || '—'}</p>
                                                    <p className="text-xs text-gray-500">{log.station_name || 'Station'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300">{log.odometer_reading.toLocaleString()} km</td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-gray-300">{log.quantity_liters} L</p>
                                            <p className="text-xs text-gray-500">@ ₹{log.price_per_liter.toFixed(1)}/L</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-white">₹{log.total_cost.toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            {canEdit ? (
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => { setEditLog(log); setForm({ vehicle_id: log.vehicle_id, fuel_type: log.fuel_type || 'diesel', quantity_liters: Number(log.quantity_liters), price_per_liter: Number(log.price_per_liter), total_cost: Number(log.total_cost), odometer_reading: log.odometer_reading, station_name: log.station_name || '' }); setShowModal(true); }} className="text-gray-400 hover:text-white transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-400 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">Done</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-lg">
                            <h2 className="text-lg font-bold text-white mb-5">Add Expense</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                <div className="space-y-4">
                                    {[
                                        { key: 'vehicle_id', label: 'Vehicle ID' },
                                        { key: 'station_name', label: 'Station' },
                                        { key: 'quantity_liters', label: 'Fuel Quantity (L)', type: 'number' },
                                        { key: 'price_per_liter', label: 'Price per Liter (₹)', type: 'number' },
                                        { key: 'total_cost', label: 'Total Cost (₹)', type: 'number' },
                                        { key: 'odometer_reading', label: 'Odometer (km)', type: 'number' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm text-gray-400 mb-1">{f.label}</label>
                                            <input type={f.type || 'text'} value={(form as Record<string, string | number>)[f.key]}
                                                onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-navy-600 text-gray-300 rounded-lg text-sm hover:bg-navy-500 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
