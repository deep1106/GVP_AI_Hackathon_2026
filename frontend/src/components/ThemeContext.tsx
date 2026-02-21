import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeCtx {
    dark: boolean;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ dark: false, toggle: () => { } });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [dark, setDark] = useState(() => {
        const stored = localStorage.getItem('fleetflow_theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('fleetflow_theme', dark ? 'dark' : 'light');
    }, [dark]);

    return (
        <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
