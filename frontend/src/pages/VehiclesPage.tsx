import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlinePencil, HiOutlineTruck, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../components/AuthContext';
import type { Vehicle } from '../types';

const statusPill = (s: string) => {
    const map: Record<string, { dot: string; bg: string; text: string; label: string }> = {
        active: { dot: 'available', bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Available' },
        maintenance: { dot: 'in_shop', bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'In Shop' },
        retired: { dot: 'idle', bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'Retired' },
    };
    const c = map[s] || map.active;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
            <span className={`status-dot ${c.dot}`} />{c.label}
        </span>
    );
};

export default function VehiclesPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const canEdit = user?.role === 'fleet_manager';
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState({ registration_number: '', make: '', model: '', year: 2024, vin: '', fuel_type: 'diesel', capacity_tons: 5, odometer_km: 0 });

    useEffect(() => { fetchVehicles(); }, [page, search]);

    const fetchVehicles = () => {
        api.get(`/api/vehicles?page=${page}&page_size=5&search=${search}`)
            .then(r => { setVehicles(r.data.items || r.data); setTotalPages(r.data.total_pages || 1); })
            .catch(() => { });
    };

    const handleSave = async () => {
        if (!form.registration_number || !form.make || !form.model || !form.vin) {
            alert("Please fill all required fields (Registration, Make, Model, VIN).");
            return;
        }
        try {
            if (editVehicle) await api.put(`/api/vehicles/${editVehicle.id}`, form);
            else await api.post('/api/vehicles', form);
            setShowModal(false); setEditVehicle(null); fetchVehicles();
        } catch (error: any) {
            alert(error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : "Error saving vehicle.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await api.delete(`/api/vehicles/${id}`);
            fetchVehicles();
        } catch { alert("Failed to delete vehicle."); }
    };

    const filtered = statusFilter === 'all' ? vehicles : vehicles.filter(v => v.status === statusFilter);

    return (
        <>
            <Helmet><title>FleetFlow – {t('vehicles.title')}</title></Helmet>
            <div className="space-y-5">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Home</span>
                    <span className="text-gray-600">{'>'}</span>
                    <span className="text-gray-500">Fleet</span>
                    <span className="text-gray-600">{'>'}</span>
                    <span className="text-primary-400 font-medium">Vehicles</span>
                </div>

                {/* Title & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Vehicle Inventory</h1>
                    {canEdit && (
                        <button
                            onClick={() => { setEditVehicle(null); setForm({ registration_number: '', make: '', model: '', year: 2024, vin: '', fuel_type: 'diesel', capacity_tons: 5, odometer_km: 0 }); setShowModal(true); }}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <HiOutlinePlus className="w-4 h-4" /> Add Vehicle
                        </button>
                    )}
                </div>

                {/* Search, Filter, Status tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by license plate, model, or driver..."
                            className="w-full pl-9 pr-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 border border-navy-600/50 rounded-lg text-sm text-gray-300 hover:bg-navy-600/50 transition-colors">
                        <HiOutlineFilter className="w-4 h-4" /> Filters
                    </button>
                    <div className="flex items-center bg-navy-700 border border-navy-600/50 rounded-lg overflow-hidden">
                        {[{ key: 'all', label: 'All Statuses' }, { key: 'active', label: 'Active' }, { key: 'maintenance', label: 'Maintenance' }].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === f.key ? 'bg-navy-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-navy-600/40 bg-navy-700/50">
                                    <th className="px-5 py-3.5">Vehicle Info</th>
                                    <th className="px-5 py-3.5">License Plate</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Odometer</th>
                                    <th className="px-5 py-3.5">Driver</th>
                                    <th className="px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-600/30">
                                {filtered.map((v, i) => (
                                    <motion.tr
                                        key={v.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-navy-600/20 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-navy-600/50 flex items-center justify-center text-gray-400">
                                                    <HiOutlineTruck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{v.make} {v.model}</p>
                                                    <p className="text-xs text-gray-500">{v.year} • {v.fuel_type.charAt(0).toUpperCase() + v.fuel_type.slice(1)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-300 font-mono">{v.registration_number}</td>
                                        <td className="px-5 py-4">{statusPill(v.status)}</td>
                                        <td className="px-5 py-4 text-sm text-gray-300">{v.odometer_km.toLocaleString()} km</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs text-gray-400">?</div>
                                                <span className="text-sm text-gray-400">Unassigned</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {canEdit ? (
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => { setEditVehicle(v); setForm({ registration_number: v.registration_number, make: v.make, model: v.model, year: v.year, vin: v.vin, fuel_type: v.fuel_type, capacity_tons: v.capacity_tons, odometer_km: v.odometer_km }); setShowModal(true); }}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(v.id)}
                                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="text-gray-500 hover:text-gray-300">⋮</button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-navy-600/40">
                        <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-300">1-{filtered.length}</span> of <span className="font-medium text-gray-300">{filtered.length}</span> vehicles</p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg bg-navy-600/50 text-gray-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-sm transition-colors">{'<'}</button>
                            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'bg-navy-600/50 text-gray-400 hover:text-white'}`}>{p}</button>
                            ))}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg bg-navy-600/50 text-gray-400 hover:text-white disabled:opacity-30 flex items-center justify-center text-sm transition-colors">{'>'}</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-navy-700 border border-navy-600/50 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                            <h2 className="text-lg font-bold text-white mb-5">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                <div className="space-y-4">
                                    {[
                                        { key: 'registration_number', label: 'Registration Number', type: 'text' },
                                        { key: 'make', label: 'Make', type: 'text' },
                                        { key: 'model', label: 'Model', type: 'text' },
                                        { key: 'year', label: 'Year', type: 'number' },
                                        { key: 'vin', label: 'VIN', type: 'text' },
                                        { key: 'capacity_tons', label: 'Capacity (tons)', type: 'number' },
                                        { key: 'odometer_km', label: 'Odometer (km)', type: 'number' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm text-gray-400 mb-1">{f.label}</label>
                                            <input
                                                type={f.type}
                                                value={(form as Record<string, string | number>)[f.key]}
                                                onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                                                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Fuel Type</label>
                                        <select value={form.fuel_type} onChange={e => setForm(prev => ({ ...prev, fuel_type: e.target.value }))} className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                                            {['diesel', 'petrol', 'cng', 'electric'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => { setShowModal(false); setEditVehicle(null); }} className="px-4 py-2 bg-navy-600 text-gray-300 rounded-lg text-sm hover:bg-navy-500 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors">
                                        {editVehicle ? 'Update' : 'Create'}
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
