import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineBell, HiOutlineShieldCheck, HiOutlineGlobe, HiOutlineColorSwatch } from 'react-icons/hi';
import { LANGUAGES } from '../i18n';

export default function SettingsPage() {
    const { user } = useAuth();
    const { dark, toggle } = useTheme();
    const { t, i18n } = useTranslation();
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });

    const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
        <>
            <Helmet><title>FleetFlow – Settings</title></Helmet>
            <div className="space-y-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-white">Settings</h1>

                {/* Success toast */}
                {saved && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm text-center">
                        ✓ Settings saved successfully
                    </motion.div>
                )}

                {/* Profile Section */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <HiOutlineUser className="w-5 h-5 text-primary-400" />
                        <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                            <input type="text" defaultValue={user?.full_name || ''} className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-gray-500 text-sm cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Role</label>
                            <input type="text" value={user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''} disabled className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-gray-500 text-sm cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone</label>
                            <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50 placeholder-gray-500" />
                        </div>
                    </div>
                    <button onClick={showSaved} className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
                        Save Changes
                    </button>
                </div>

                {/* Appearance */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <HiOutlineColorSwatch className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Appearance</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Dark Mode</p>
                            <p className="text-xs text-gray-400 mt-0.5">Toggle between light and dark themes</p>
                        </div>
                        <button onClick={toggle}
                            className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-primary-600' : 'bg-gray-400'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? 'left-[26px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>

                {/* Language */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <HiOutlineGlobe className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Language & Region</h2>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Display Language</label>
                        <select value={i18n.language} onChange={e => { i18n.changeLanguage(e.target.value); showSaved(); }}
                            className="w-full max-w-xs px-3 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50">
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <HiOutlineBell className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        {([['email', 'Email Notifications', 'Receive alerts via email'], ['push', 'Push Notifications', 'Browser push notifications'], ['sms', 'SMS Alerts', 'Critical alerts via SMS']] as const).map(([key, title, desc]) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white font-medium">{title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                                </div>
                                <button onClick={() => { setNotifications(prev => ({ ...prev, [key]: !prev[key] })); showSaved(); }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-primary-600' : 'bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? 'left-[26px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security */}
                <div className="bg-navy-700 border border-navy-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <HiOutlineShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>
                    <button onClick={showSaved} className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-gray-300 rounded-lg text-sm font-medium transition-colors">
                        Change Password
                    </button>
                </div>
            </div>
        </>
    );
}
