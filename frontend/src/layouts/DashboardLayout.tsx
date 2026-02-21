import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '../components/NotificationBell';
import {
    HiOutlineViewGrid, HiOutlineLocationMarker, HiOutlineTruck,
    HiOutlineUserGroup, HiOutlineAdjustments, HiOutlineCurrencyDollar,
    HiOutlineChartBar, HiOutlineCog, HiOutlineSearch,
    HiOutlineMenu, HiOutlineMoon, HiOutlineSun, HiOutlineLightningBolt
} from 'react-icons/hi';
import type { IconType } from 'react-icons';

interface NavItem {
    to: string;
    icon: IconType;
    tKey: string;
    literal?: boolean;
    badge?: number;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        label: 'OVERVIEW',
        items: [
            { to: '/', icon: HiOutlineViewGrid, tKey: 'nav.dashboard' },
            { to: '/map', icon: HiOutlineLocationMarker, tKey: 'Live Map', literal: true },
        ],
    },
    {
        label: 'MANAGEMENT',
        items: [
            { to: '/vehicles', icon: HiOutlineTruck, tKey: 'nav.vehicles' },
            { to: '/drivers', icon: HiOutlineUserGroup, tKey: 'nav.drivers' },
        ],
    },
    {
        label: 'OPERATIONS',
        items: [
            { to: '/maintenance', icon: HiOutlineAdjustments, tKey: 'nav.maintenance', badge: 3 },
            { to: '/trips', icon: HiOutlineCurrencyDollar, tKey: 'nav.trips' },
        ],
    },
    {
        label: 'INSIGHTS',
        items: [
            { to: '/analytics', icon: HiOutlineChartBar, tKey: 'nav.analytics' },
            { to: '/automation', icon: HiOutlineLightningBolt, tKey: 'Automation', literal: true },
        ],
    },
];

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { dark, toggle: toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ vehicles: any[], drivers: any[], trips: any[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Clear search on page navigation
    useEffect(() => {
        setSearchQuery('');
        setShowDropdown(false);
    }, [location.pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search fetch
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            setShowDropdown(false);
            return;
        }

        const delayFn = setTimeout(async () => {
            setIsSearching(true);
            setShowDropdown(true);
            try {
                const res = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error('Search failed:', err);
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(delayFn);
    }, [searchQuery]);

    const handleResultClick = (type: string, query: string) => {
        setShowDropdown(false);
        setSearchQuery('');
        navigate(`/${type}s?search=${encodeURIComponent(query)}`);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const languageOptions = [
        { code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' },
        { code: 'gu', label: 'ગુજરાતી' }, { code: 'mr', label: 'मराठी' },
        { code: 'ta', label: 'தமிழ்' }, { code: 'te', label: 'తెలుగు' },
        { code: 'kn', label: 'ಕನ್ನಡ' }, { code: 'bn', label: 'বাংলা' },
        { code: 'ml', label: 'മലയാളം' }, { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200 dark:border-navy-600/30">
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
                    </svg>
                </div>
                <div>
                    <span className="text-gray-900 dark:text-white font-bold text-lg leading-none">FleetFlow</span>
                    <span className="block text-[11px] text-gray-500 tracking-wider">Enterprise Logistics</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {navSections.map((section) => (
                    <div key={section.label}>
                        <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider">{section.label}</p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                            ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border-l-[3px] border-primary-500'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-600/40'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.literal ? item.tKey : t(item.tKey)}</span>
                                    {item.badge && (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* System section */}
            <div className="px-3 pb-2">
                <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider">SYSTEM</p>
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-600/40 transition-all"
                >
                    <HiOutlineCog className="w-5 h-5" />
                    <span>Settings</span>
                </NavLink>
            </div>

            {/* User profile */}
            <div className="border-t border-gray-200 dark:border-navy-600/30 px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Role'}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Logout">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );

    return (
        <div className={`flex h-screen ${dark ? 'bg-navy-900' : 'bg-gray-50'}`}>
            {/* Desktop sidebar */}
            <aside className={`hidden lg:flex lg:w-60 flex-col flex-shrink-0 border-r ${dark ? 'bg-navy-800 border-navy-600/30' : 'bg-white border-gray-200'}`}>
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className={`fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden border-r ${dark ? 'bg-navy-800 border-navy-600/30' : 'bg-white border-gray-200'}`}
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top navbar */}
                <header className={`h-16 border-b flex items-center justify-between px-6 flex-shrink-0 ${dark ? 'bg-navy-800 border-navy-600/30' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <HiOutlineMenu className="w-6 h-6" />
                        </button>

                        {/* Search bar */}
                        <div className="relative flex-1 max-w-md hidden sm:block" ref={searchRef}>
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                onFocus={() => { if (searchQuery) setShowDropdown(true); }}
                                placeholder="Search fleet, drivers, ID..."
                                className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none transition-colors ${dark
                                    ? 'bg-navy-700 border border-navy-600/50 text-gray-300 placeholder-gray-500 focus:border-primary-500/50'
                                    : 'bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:bg-white'
                                    }`}
                            />

                            {/* Search Dropdown Panel */}
                            {showDropdown && searchQuery && (
                                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50 ${dark ? 'bg-navy-800 border-navy-600/50' : 'bg-white border-gray-200'}`}>
                                    {isSearching ? (
                                        <div className="p-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                                            Searching...
                                        </div>
                                    ) : searchResults ? (
                                        <div className="max-h-[60vh] overflow-y-auto py-2">
                                            {(!searchResults.vehicles.length && !searchResults.drivers.length && !searchResults.trips.length) ? (
                                                <div className="p-4 text-sm text-gray-500 text-center">No results found for "{searchQuery}"</div>
                                            ) : (
                                                <>
                                                    {searchResults.vehicles.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-black/5 dark:bg-white/5">Vehicles</div>
                                                            {searchResults.vehicles.map(v => (
                                                                <button key={`veh-${v.id}`} onClick={() => handleResultClick('vehicle', v.title)} className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                                        <HiOutlineTruck className="w-4 h-4 text-gray-400" /> {v.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 pl-6">{v.subtitle}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {searchResults.drivers.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-black/5 dark:bg-white/5">Drivers</div>
                                                            {searchResults.drivers.map(d => (
                                                                <button key={`drv-${d.id}`} onClick={() => handleResultClick('driver', d.title)} className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                                        <HiOutlineUserGroup className="w-4 h-4 text-gray-400" /> {d.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 pl-6">{d.subtitle}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {searchResults.trips.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-black/5 dark:bg-white/5">Trips</div>
                                                            {searchResults.trips.map(t => (
                                                                <button key={`trp-${t.id}`} onClick={() => handleResultClick('trip', t.title)} className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                                        <HiOutlineCurrencyDollar className="w-4 h-4 text-gray-400" /> {t.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 pl-6">{t.subtitle}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Language selector */}
                        <select
                            value={i18n.language}
                            onChange={e => i18n.changeLanguage(e.target.value)}
                            className={`text-xs rounded-lg px-2 py-1.5 focus:outline-none hidden md:block ${dark
                                ? 'bg-navy-700 border border-navy-600/50 text-gray-300'
                                : 'bg-gray-100 border border-gray-200 text-gray-700'
                                }`}
                        >
                            {languageOptions.map(l => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>

                        {/* Notification bell */}
                        <NotificationBell />

                        {/* Settings icon */}
                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hidden sm:block">
                            <HiOutlineCog className="w-5 h-5" />
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors text-sm ${dark
                                ? 'bg-navy-700 border border-navy-600/50 text-gray-300 hover:text-white'
                                : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {dark ? <HiOutlineMoon className="w-4 h-4" /> : <HiOutlineSun className="w-4 h-4" />}
                            <span className="hidden sm:inline text-xs">{dark ? 'Dark' : 'Light'}</span>
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className={`flex-1 overflow-y-auto p-6 ${dark ? 'bg-navy-900' : 'bg-gray-50'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
