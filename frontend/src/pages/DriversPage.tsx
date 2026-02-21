import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../components/AuthContext';
import type { Driver } from '../types';

const statusConfig: Record<string, { dot: string; label: string; color: string }> = {
    available: { dot: 'available', label: 'On Duty', color: 'text-emerald-400' },
    on_trip: { dot: 'on_trip', label: 'On Trip', color: 'text-blue-400' },
    off_duty: { dot: 'off_duty', label: 'Off Duty', color: 'text-purple-400' },
    suspended: { dot: 'suspended', label: 'Suspended', color: 'text-red-400' },
};

const scoreColor = (s: number) => s >= 90 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : s >= 75 ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : s >= 60 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30';
const barColor = (pct: number) => pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';

export default function DriversPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const canEdit = user?.role === 'fleet_manager';
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editDriver, setEditDriver] = useState<Driver | null>(null);
    const [form, setForm] = useState({ full_name: '', phone: '', email: '', license_number: '', license_expiry: '', employee_id: '' });

    useEffect(() => { fetchDrivers(); }, [page, search]);

    const fetchDrivers = () => {
        api.get(`/api/drivers?page=${page}&page_size=5&search=${search}`)
            .then(r => { setDrivers(r.data.items || r.data); setTotalPages(r.data.total_pages || 1); setTotal(r.data.total || r.data.length); })
            .catch(() => { });
    };

    const handleSave = async () => {
        if (!form.full_name || !form.employee_id || !form.phone || !form.license_number || !form.license_expiry) {
            alert("Please fill all required fields.");
            return;
        }
        try {
            if (editDriver) await api.put(`/api/drivers/${editDriver.id}`, form);
            else await api.post('/api/drivers', form);
            setShowModal(false); setEditDriver(null); fetchDrivers();
        } catch (error: any) {
            alert(error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : "Error saving driver.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this driver?')) return;
        try {
            await api.delete(`/api/drivers/${id}`);
            fetchDrivers();
        } catch { alert("Failed to delete driver."); }
    };

    // Mock complaints data
    const getComplaints = (score: number) => score < 70 ? 12 : score < 80 ? 4 : score < 90 ? 2 : score >= 95 ? 0 : 1;

    return (
        <>
            <Helmet><title>FleetFlow – {t('drivers.title')}</title></Helmet>
            <div className="space-y-5">
                {/* Header */}
                <h1 className="text-2xl font-bold text-white">Driver Performance & Safety Profiles</h1>

                {/* Search & filter bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search drivers by name or license..."
                            className="w-full pl-9 pr-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 hover:bg-navy-600/50 transition-colors">
                            <span className="text-xs">⊕</span> Group by
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 hover:bg-navy-600/50 transition-colors">
                            <HiOutlineFilter className="w-4 h-4" /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 hover:bg-navy-600/50 transition-colors">
                            <span className="text-xs">↕</span> Sort by
                        </button>
                    </div>
                    {canEdit && (
                        <button onClick={() => { setEditDriver(null); setForm({ full_name: '', phone: '', email: '', license_number: '', license_expiry: '', employee_id: '' }); setShowModal(true); }}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-auto">
                            <HiOutlinePlus className="w-4 h-4" /> New Driver
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-navy-600/40 bg-navy-700/50">
                                    <th className="px-5 py-3.5">Name</th>
                                    <th className="px-5 py-3.5">License #</th>
                                    <th className="px-5 py-3.5">Expiry</th>
                                    <th className="px-5 py-3.5">Completion Rate</th>
                                    <th className="px-5 py-3.5 text-center">ⓘ</th>
                                    <th className="px-5 py-3.5">Safety Score</th>
                                    <th className="px-5 py-3.5">Complaints</th>
                                    <th className="px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-600/30">
                                {drivers.map((d, i) => {
                                    const sc = statusConfig[d.status] || statusConfig.available;
                                    const completionPct = Math.round(d.total_trips > 0 ? Math.min((d.total_trips / (d.total_trips + 5)) * 100, 99) : 85);
                                    const complaints = getComplaints(d.safety_score);
                                    const isExpired = new Date(d.license_expiry) < new Date();
                                    return (
                                        <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                            className={`hover:bg-navy-600/20 transition-colors ${isExpired && d.safety_score < 70 ? 'bg-red-500/5' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {d.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                        </div>
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-navy-700 ${sc.dot === 'available' ? 'bg-emerald-500' : sc.dot === 'on_trip' ? 'bg-blue-500' : sc.dot === 'off_duty' ? 'bg-purple-500' : 'bg-red-500'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{d.full_name}</p>
                                                        <p className={`text-xs ${sc.color}`}>{sc.label}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm text-gray-300 bg-navy-600/50 px-2 py-0.5 rounded font-mono">{d.license_number.substring(0, 5) || d.employee_id}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-sm ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                                                    {isExpired ? `Expired (${new Date(d.license_expiry).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })})` : new Date(d.license_expiry).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 rounded-full bg-navy-600/50 overflow-hidden">
                                                        <div className={`h-full rounded-full ${barColor(completionPct)}`} style={{ width: `${completionPct}%` }} />
                                                    </div>
                                                    <span className={`text-sm font-medium ${completionPct >= 90 ? 'text-emerald-400' : completionPct >= 75 ? 'text-blue-400' : 'text-amber-400'}`}>{completionPct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center text-gray-500 text-sm">—</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreColor(d.safety_score)}`}>
                                                    {d.safety_score} / 100
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-sm font-medium ${complaints > 5 ? 'text-red-400' : complaints > 2 ? 'text-amber-400' : 'text-gray-300'}`}>
                                                    {complaints}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {canEdit ? (
                                                        <div className="flex items-center gap-3">
                                                            {isExpired && d.safety_score < 70 && (
                                                                <button className="text-amber-400 hover:text-amber-300 transition-colors" title="Action Required">⚠</button>
                                                            )}
                                                            <button
                                                                onClick={() => { setEditDriver(d); setForm({ full_name: d.full_name, phone: d.phone, email: d.email || '', license_number: d.license_number, license_expiry: d.license_expiry, employee_id: d.employee_id }); setShowModal(true); }}
                                                                className="text-gray-400 hover:text-white transition-colors"
                                                            >
                                                                <HiOutlinePencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(d.id)}
                                                                className="text-gray-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <HiOutlineTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button className="text-gray-500 hover:text-gray-300">⋮</button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-navy-600/40">
                        <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-300">1-{drivers.length}</span> of <span className="font-medium text-gray-300">{total}</span> drivers</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-navy-600/50 text-gray-400 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors">Previous</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-navy-600/50 text-gray-400 rounded-lg text-sm hover:text-white disabled:opacity-30 transition-colors">Next</button>
                        </div>
                    </div>
                </div>

                {/* Bottom info cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-2">Compliance Check</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            System automatically locks trips for drivers with expired licenses or safety scores below 70.
                        </p>
                        <button className="text-sm text-primary-400 hover:text-primary-300 font-medium mt-3 flex items-center gap-1 transition-colors">
                            Review Policy Settings →
                        </button>
                    </div>
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Fleet Safety Index</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">88%</span>
                                    <span className="text-sm text-emerald-400 font-medium">↑ 2.4%</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">Based on braking incidents, speeding, and rest compliance.</p>
                            </div>
                            <svg className="w-16 h-12 text-emerald-500/30" viewBox="0 0 64 48" fill="none">
                                <polyline points="0,40 16,35 32,25 48,28 64,10" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                            <h2 className="text-lg font-bold text-white mb-5">{editDriver ? 'Edit Driver' : 'New Driver'}</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                <div className="space-y-4">
                                    {[
                                        { key: 'full_name', label: 'Full Name' },
                                        { key: 'employee_id', label: 'Employee ID' },
                                        { key: 'phone', label: 'Phone' },
                                        { key: 'email', label: 'Email' },
                                        { key: 'license_number', label: 'License Number' },
                                        { key: 'license_expiry', label: 'License Expiry', type: 'date' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm text-gray-400 mb-1">{f.label}</label>
                                            <input type={f.type || 'text'} value={(form as Record<string, string>)[f.key]}
                                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => { setShowModal(false); setEditDriver(null); }} className="px-4 py-2 bg-navy-600 text-gray-300 rounded-lg text-sm hover:bg-navy-500 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">
                                        {editDriver ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
