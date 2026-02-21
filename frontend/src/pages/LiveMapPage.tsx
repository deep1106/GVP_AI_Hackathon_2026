import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const vehiclePositions = [
    { id: 'VH-1024', driver: 'John Doe', lat: 19.076, lng: 72.877, status: 'on_trip', location: 'Mumbai, MH' },
    { id: 'VH-1088', driver: 'Jane Smith', lat: 28.613, lng: 77.209, status: 'available', location: 'Delhi, DL' },
    { id: 'VH-2049', driver: 'Michael S.', lat: 22.572, lng: 88.364, status: 'on_trip', location: 'Kolkata, WB' },
    { id: 'VH-3012', driver: 'Sarah Lee', lat: 12.972, lng: 77.594, status: 'maintenance', location: 'Bengaluru, KA' },
    { id: 'VH-4055', driver: 'Alex W.', lat: 23.023, lng: 72.571, status: 'on_trip', location: 'Ahmedabad, GJ' },
    { id: 'VH-5021', driver: 'Pradeep R.', lat: 17.385, lng: 78.487, status: 'available', location: 'Hyderabad, TG' },
    { id: 'VH-6033', driver: 'Kavita M.', lat: 13.083, lng: 80.271, status: 'on_trip', location: 'Chennai, TN' },
];

const statusColors: Record<string, string> = {
    on_trip: '#3b82f6', available: '#10b981', maintenance: '#f59e0b',
};
const statusLabels: Record<string, string> = {
    on_trip: 'On Trip', available: 'Available', maintenance: 'Maintenance',
};

export default function LiveMapPage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = L.map(mapRef.current).setView([22.5, 78.9], 5);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
        }).addTo(map);

        // Add vehicle markers
        vehiclePositions.forEach(v => {
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${statusColors[v.status]};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -14],
            });

            L.marker([v.lat, v.lng], { icon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:160px;font-family:system-ui,sans-serif;">
                        <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${v.id}</div>
                        <div style="font-size:12px;color:#64748b;">Driver: ${v.driver}</div>
                        <div style="font-size:12px;color:#64748b;">Location: ${v.location}</div>
                        <div style="margin-top:8px;font-size:11px;font-weight:600;color:${statusColors[v.status]};background:${statusColors[v.status]}22;padding:3px 10px;border-radius:4px;display:inline-block;">
                            ${statusLabels[v.status]}
                        </div>
                    </div>
                `);
        });

        // Cleanup
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    return (
        <>
            <Helmet><title>FleetFlow – Live Map</title></Helmet>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Live Fleet Map</h1>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> On Trip</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Map container */}
                    <div className="lg:col-span-3 bg-navy-700 border border-navy-600/40 rounded-xl overflow-hidden">
                        <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
                    </div>

                    {/* Vehicle list sidebar */}
                    <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-white mb-3">Active Vehicles ({vehiclePositions.length})</h3>
                        <div className="space-y-2.5">
                            {vehiclePositions.map(v => (
                                <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-600/30 transition-colors cursor-pointer">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[v.status] }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{v.id}</p>
                                        <p className="text-xs text-gray-400 truncate">{v.driver}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-right truncate max-w-[80px]">{v.location}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
