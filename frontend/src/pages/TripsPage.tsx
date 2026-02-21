import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { HiOutlineTruck, HiOutlineX, HiOutlineTrash } from 'react-icons/hi';
import api from '../api/client';
import type { Trip } from '../types';
import { useAuth } from '../components/AuthContext';

const statusSteps = ['Draft', 'Scheduled', 'Dispatched', 'Completed'];
const stepIndex: Record<string, number> = { scheduled: 1, dispatched: 2, in_progress: 2, completed: 3, cancelled: -1 };

export default function TripsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const canEdit = ['fleet_manager', 'dispatcher'].includes(user?.role || '');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        api.get(`/api/trips?page=${page}&page_size=10&search=${search}`)
            .then(r => setTrips(r.data.items || r.data))
            .catch(() => { });
    }, [page, search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        try {
            await api.delete(`/api/trips/${id}`);
            setSelectedTrip(null);
            const r = await api.get(`/api/trips?page=${page}&page_size=10&search=${search}`);
            setTrips(r.data.items || r.data);
        } catch (error: any) {
            alert(error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : "Error saving trip.");
        }
    };

    const currentStep = selectedTrip ? (stepIndex[selectedTrip.status] ?? 0) : 0;

    return (
        <>
            <Helmet><title>FleetFlow – {t('trips.title')}</title></Helmet>
            <div className="flex gap-6 h-[calc(100vh-7rem)]">
                {/* Left panel: Trip list */}
                <div className={`${selectedTrip ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-1/2 space-y-4`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Trip Management</h1>
                        </div>
                        <span className="text-xs bg-navy-600/50 text-gray-400 px-2.5 py-1 rounded-lg">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </span>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="kpi-card accent-teal bg-navy-700 border border-navy-600/40 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">Total Active Trips</p>
                                <HiOutlineTruck className="w-5 h-5 text-gray-500" />
                            </div>
                            <p className="text-3xl font-bold text-white mt-1">{trips.length || 142}</p>
                            <span className="text-xs text-emerald-400 font-medium">↑ 12%</span>
                        </div>
                        <div className="kpi-card accent-blue bg-navy-700 border border-navy-600/40 p-4">
                            <p className="text-xs text-gray-400">In Transit</p>
                            <p className="text-3xl font-bold text-white mt-1">{trips.filter(t => t.status === 'in_progress').length || 89}</p>
                            <span className="text-xs text-gray-400">On schedule</span>
                        </div>
                    </div>

                    {/* Active Fleet list */}
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl flex-1 overflow-hidden flex flex-col">
                        <div className="px-5 py-3 border-b border-navy-600/40">
                            <h3 className="text-sm font-semibold text-white">Active Fleet</h3>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-navy-600/30">
                                        <th className="px-5 py-2.5 text-left">Trip ID</th>
                                        <th className="px-5 py-2.5 text-left">Origin & Destination</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-600/20">
                                    {trips.map(trip => (
                                        <tr
                                            key={trip.id}
                                            onClick={() => setSelectedTrip(trip)}
                                            className={`cursor-pointer transition-colors ${selectedTrip?.id === trip.id ? 'bg-primary-500/10' : 'hover:bg-navy-600/20'}`}
                                        >
                                            <td className="px-5 py-3 text-sm font-medium text-primary-400">#{trip.trip_number}</td>
                                            <td className="px-5 py-3">
                                                <p className="text-sm text-white">{trip.origin}</p>
                                                <p className="text-xs text-gray-500">→ {trip.destination}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right panel: Trip detail */}
                {selectedTrip ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-navy-700 border border-navy-600/40 rounded-xl overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600/40">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    Trip Details
                                    <span className="text-xs bg-navy-600 text-gray-300 px-2 py-0.5 rounded font-mono">#{selectedTrip.trip_number}</span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Created on {new Date(selectedTrip.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} • Manage dispatch
                                </p>
                            </div>
                            <button onClick={() => setSelectedTrip(null)} className="text-gray-400 hover:text-white transition-colors">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="bg-navy-800 border border-navy-600/30 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Trip Status</h3>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${selectedTrip.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                                        selectedTrip.status === 'in_progress' ? 'bg-blue-500/15 text-blue-400' :
                                            selectedTrip.status === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                                                'bg-amber-500/15 text-amber-400'
                                        }`}>
                                        {selectedTrip.status.toUpperCase().replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Stepper */}
                                <div className="flex items-center justify-between">
                                    {statusSteps.map((step, i) => (
                                        <div key={step} className="flex items-center flex-1">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i <= currentStep ? 'bg-emerald-500' : 'bg-navy-600'
                                                    }`}>
                                                    {i <= currentStep && <span className="text-white text-xs">✓</span>}
                                                </div>
                                                <span className={`text-[10px] mt-1.5 ${i <= currentStep ? 'text-white' : 'text-gray-500'}`}>{step}</span>
                                            </div>
                                            {i < statusSteps.length - 1 && (
                                                <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-emerald-500' : 'bg-navy-600'}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Route */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <span className="text-primary-400">✦</span> Route Optimization
                                </h3>
                                <div className="bg-navy-800 border border-navy-600/30 rounded-xl p-4 h-32 flex items-center justify-center text-gray-500 text-sm">
                                    Route map visualization
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="bg-navy-800 border border-navy-600/30 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-500/15 flex items-center justify-center text-primary-400 font-bold text-xs">A</div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Origin</p>
                                            <p className="text-sm text-white font-medium">{selectedTrip.origin}</p>
                                        </div>
                                    </div>
                                    <div className="bg-navy-800 border border-navy-600/30 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs">B</div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Destination</p>
                                            <p className="text-sm text-white font-medium">{selectedTrip.destination}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignment */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <span className="text-primary-400">✦</span> Assignment
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Cargo</p>
                                        <p className="text-sm text-gray-300">{selectedTrip.cargo_description || 'General cargo'} • {selectedTrip.cargo_weight_tons} tons</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Distance</p>
                                        <p className="text-sm text-gray-300">{selectedTrip.distance_km} km</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Estimated Cost</p>
                                        <p className="text-sm text-gray-300">${selectedTrip.cost?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                {canEdit && (
                                    <button
                                        onClick={() => handleDelete(selectedTrip.id)}
                                        className="flex-[0.5] py-2.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center"
                                        title="Delete Trip"
                                    >
                                        <HiOutlineTrash className="w-5 h-5" />
                                    </button>
                                )}
                                <button className="flex-1 py-2.5 bg-navy-600 border border-navy-500/50 text-gray-300 rounded-lg text-sm font-medium hover:bg-navy-500 transition-colors">
                                    Save as Draft
                                </button>
                                <button className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    Dispatch Now <span>➤</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="hidden lg:flex flex-1 bg-navy-700 border border-navy-600/40 rounded-xl items-center justify-center">
                        <p className="text-gray-500">Select a trip to view details</p>
                    </div>
                )}
            </div>
        </>
    );
}
