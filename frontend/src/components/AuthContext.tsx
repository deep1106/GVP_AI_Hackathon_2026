import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthCtx {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthCtx>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('fleetflow_token'));
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('fleetflow_user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('fleetflow_token', newToken);
        localStorage.setItem('fleetflow_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('fleetflow_token');
        localStorage.removeItem('fleetflow_user');
    };

    useEffect(() => {
        // Sync across tabs
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'fleetflow_token' && !e.newValue) {
                setToken(null);
                setUser(null);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
