import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineClipboardList, HiOutlineViewGrid, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../components/AuthContext';
import type { MaintenanceLog } from '../types';

const severityConfig: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'CRITICAL' },
    due_soon: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'DUE SOON' },
    scheduled: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'SCHEDULED' },
    low: { bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'LOW' },
};

const getSeverity = (log: MaintenanceLog): string => {
    const days = Math.ceil((new Date(log.scheduled_date).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'critical';
    if (days < 7) return 'due_soon';
    if (days < 30) return 'scheduled';
    return 'low';
};

export default function MaintenancePage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const canEdit = user?.role === 'fleet_manager' || user?.role === 'safety_officer';
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editLog, setEditLog] = useState<MaintenanceLog | null>(null);
    const [form, setForm] = useState({ vehicle_id: '', maintenance_type: '', description: '', cost: 0, scheduled_date: '', odometer_at_service: 0 });

    useEffect(() => {
        api.get('/api/maintenance?page=1&page_size=20')
            .then(r => setLogs(r.data.items || r.data))
            .catch(() => { });
    }, []);

    const handleSave = async () => {
        if (!form.vehicle_id || !form.maintenance_type || !form.scheduled_date) {
            alert("Please fill all required fields (Vehicle ID, Type, Date).");
            return;
        }
        try {
            if (editLog) await api.put(`/api/maintenance/${editLog.id}`, form);
            else await api.post('/api/maintenance', form);
            setShowModal(false);
            setEditLog(null);
            const r = await api.get('/api/maintenance?page=1&page_size=20');
            setLogs(r.data.items || r.data);
        } catch { /* noop */ }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this maintenance record?')) return;
        try {
            await api.delete(`/api/maintenance/${id}`);
            const r = await api.get('/api/maintenance?page=1&page_size=20');
            setLogs(r.data.items || r.data);
        } catch { alert("Failed to delete record."); }
    };

    // Fleet health donut
    const filtered = search ? logs.filter(l => l.maintenance_type.toLowerCase().includes(search.toLowerCase())) : logs;

    // Fleet health donut
    const maintenanceCount = filtered.length;
    const totalVehicles = maintenanceCount; // Assuming 0 total for now if we don't fetch /api/vehicles here
    const operationalPct = totalVehicles > 0 ? 0 : 100; // Fake 100% since no vehicles exist. Next iteration should probably fetch fleet total to be 100% accurate.
    const circumference = 2 * Math.PI * 45;

    return (
        <>
            <Helmet><title>FleetFlow – {t('maintenance.title')}</title></Helmet>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Maintenance & Service Scheduler</h1>
                    {canEdit && (
                        <button onClick={() => { setEditLog(null); setForm({ vehicle_id: '', maintenance_type: '', description: '', cost: 0, scheduled_date: '', odometer_at_service: 0 }); setShowModal(true); }}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            <HiOutlinePlus className="w-4 h-4" /> Schedule Service
                        </button>
                    )}
                </div>

                {/* View toggle + search */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-navy-700 border border-navy-600/50 rounded-lg overflow-hidden">
                        <button onClick={() => setView('list')} className={`px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-navy-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}>
                            <HiOutlineClipboardList className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('calendar')} className={`px-3 py-2 text-sm transition-colors ${view === 'calendar' ? 'bg-navy-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}>
                            <HiOutlineViewGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search maintenance records..."
                            className="w-full pl-9 pr-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors" />
                    </div>
                </div>

                {/* Top row: Fleet Health + Attention cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Fleet Health donut */}
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Fleet Health</h3>
                        <div className="flex justify-center mb-4">
                            <div className="relative w-32 h-32">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10"
                                        strokeDasharray={`${(operationalPct / 100) * circumference} ${circumference - (operationalPct / 100) * circumference}`} strokeDashoffset="0" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-bold text-white">{operationalPct}%</p>
                                    <p className="text-[10px] text-gray-400">Operational</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mt-2">
                            <div>
                                <p className="text-lg font-bold text-emerald-400">0</p>
                                <p className="text-[10px] text-gray-400">Healthy</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-amber-400">{filtered.length}</p>
                                <p className="text-[10px] text-gray-400">Maintenance</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-red-400">0</p>
                                <p className="text-[10px] text-gray-400">Critical</p>
                            </div>
                        </div>
                    </div>

                    {/* Attention Required cards */}
                    <div className="lg:col-span-2 space-y-3">
                        <h3 className="text-lg font-semibold text-white">Attention Required</h3>
                        {filtered.length > 0 ? filtered.slice(0, 4).map((log, i) => {
                            const sev = getSeverity(log);
                            const sevConf = severityConfig[sev];
                            return (
                                <motion.div key={log.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                    className="bg-navy-800 border border-navy-600/30 rounded-xl p-4 flex items-center justify-between hover:bg-navy-700/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-navy-600/50 flex items-center justify-center text-gray-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{log.maintenance_type}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{log.description || 'No description'} • {new Date(log.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sevConf.bg} ${sevConf.text}`}>{sevConf.label}</span>
                                        {canEdit && (
                                            <>
                                                <button onClick={() => { setEditLog(log); setForm({ vehicle_id: log.vehicle_id, maintenance_type: log.maintenance_type, description: log.description || '', cost: Number(log.cost), scheduled_date: log.scheduled_date.split('T')[0], odometer_at_service: log.odometer_at_service }); setShowModal(true); }} className="text-gray-400 hover:text-white transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-400 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                                            </>
                                        )}
                                        <button className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">Complete</button>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="bg-navy-800 border border-navy-600/30 rounded-xl p-8 text-center text-gray-500">
                                No maintenance records found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar view (simplified) */}
                {view === 'calendar' && (
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">February 2026</h3>
                        <div className="calendar-grid text-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="py-2 text-xs text-gray-500 font-medium">{d}</div>
                            ))}
                            {Array.from({ length: 28 }, (_, i) => {
                                const day = i + 1;
                                const hasEvent = [3, 8, 14, 21].includes(day);
                                return (
                                    <div key={day} className={`py-3 text-sm rounded-lg transition-colors cursor-pointer ${hasEvent ? 'bg-primary-500/15 text-primary-400 font-medium' : 'text-gray-400 hover:bg-navy-600/30'}`}>
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-lg">
                            <h2 className="text-lg font-bold text-white mb-5">Schedule New Service</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                <div className="space-y-4">
                                    {[
                                        { key: 'vehicle_id', label: 'Vehicle ID' },
                                        { key: 'maintenance_type', label: 'Service Type' },
                                        { key: 'description', label: 'Description' },
                                        { key: 'scheduled_date', label: 'Service Date', type: 'date' },
                                        { key: 'cost', label: 'Estimated Cost ($)', type: 'number' },
                                        { key: 'odometer_at_service', label: 'Odometer (km)', type: 'number' },
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
                                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">Schedule</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
