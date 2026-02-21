/**
 * FleetFlow – NotificationBell component
 * Real-time notification bell with dropdown panel and badge count.
 */

import { useState, useRef, useEffect } from 'react';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineX } from 'react-icons/hi';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { useAuth } from './AuthContext';

const severityColors: Record<string, string> = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
};

const typeIcons: Record<string, string> = {
    safety: '🛡️',
    financial: '💸',
    maintenance: '🔧',
    compliance: '📋',
    operational: '⚙️',
};

function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
    const { token } = useAuth();
    const { notifications, unreadCount, connected, markRead, markAllRead } = useNotifications(token);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotifClick = (n: Notification) => {
        if (!n.is_read) markRead(n.id);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2"
                aria-label="Notifications"
            >
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Connected indicator */}
                <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-10 w-96 max-h-[520px] rounded-xl shadow-2xl border z-50 flex flex-col bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-600/50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-navy-600/40">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                            <p className="text-[11px] text-gray-500">
                                {unreadCount} unread · {connected ? '🟢 Live' : '⚪ Reconnecting…'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                                >
                                    <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <HiOutlineBell className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotifClick(n)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-navy-700/40 hover:bg-gray-50 dark:hover:bg-navy-700/30 transition-colors flex gap-3 items-start ${!n.is_read ? 'bg-blue-50/50 dark:bg-navy-700/20' : ''
                                        }`}
                                >
                                    {/* Severity dot */}
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="text-lg">{typeIcons[n.type] || '🔔'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityColors[n.severity] || 'bg-gray-400'}`} />
                                            <p className={`text-sm font-medium truncate ${!n.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {n.title}
                                            </p>
                                        </div>
                                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                    {!n.is_read && (
                                        <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
