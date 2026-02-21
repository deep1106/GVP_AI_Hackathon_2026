/**
 * FleetFlow – useNotifications hook
 * Combines REST API polling for initial data + WebSocket for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Notification {
    id: string;
    type: 'safety' | 'financial' | 'maintenance' | 'compliance' | 'operational';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: string;
    is_read: boolean;
    created_at: string;
}

const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000';

export function useNotifications(token: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch initial notifications from REST API
    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const [notifRes, countRes] = await Promise.all([
                fetch(`${API_BASE}/notifications?page_size=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/notifications/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.items || []);
            }
            if (countRes.ok) {
                const data = await countRes.json();
                setUnreadCount(data.unread_count ?? 0);
            }
        } catch (err) {
            console.warn('[useNotifications] REST fetch failed:', err);
        }
    }, [token]);

    // Mark a notification as read
    const markRead = useCallback(async (id: string) => {
        if (!token) return;
        try {
            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.warn('[useNotifications] markRead failed:', err);
        }
    }, [token]);

    // Mark all as read
    const markAllRead = useCallback(async () => {
        if (!token) return;
        try {
            await fetch(`${API_BASE}/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.warn('[useNotifications] markAllRead failed:', err);
        }
    }, [token]);

    // WebSocket connection
    useEffect(() => {
        if (!token) return;

        fetchNotifications();

        const connect = () => {
            const ws = new WebSocket(`${WS_BASE}/ws/notifications?token=${token}`);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                // Keepalive ping every 30s
                pingRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) ws.send('ping');
                }, 30000);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.event === 'new_notification') {
                        const notif: Notification = {
                            id: msg.id,
                            type: msg.type,
                            severity: msg.severity,
                            title: msg.title,
                            message: msg.message,
                            entity_type: msg.entity_type,
                            entity_id: msg.entity_id,
                            is_read: false,
                            created_at: msg.created_at,
                        };
                        setNotifications(prev => [notif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                } catch { /* ignore parse errors */ }
            };

            ws.onclose = () => {
                setConnected(false);
                if (pingRef.current) clearInterval(pingRef.current);
                // Reconnect after 5 seconds
                setTimeout(connect, 5000);
            };

            ws.onerror = () => ws.close();
        };

        connect();

        return () => {
            if (pingRef.current) clearInterval(pingRef.current);
            wsRef.current?.close();
        };
    }, [token]);

    return { notifications, unreadCount, connected, markRead, markAllRead, refetch: fetchNotifications };
}
