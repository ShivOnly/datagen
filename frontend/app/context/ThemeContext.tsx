'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type ThemeValue = 'light' | 'dark';
type ThemeCtx = { theme: ThemeValue; toggleTheme: () => void };

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeValue>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: ThemeValue | null = null;
    try {
      saved = (localStorage.getItem('theme') as ThemeValue | null) ?? null;
    } catch {}

    let system: ThemeValue = 'light';
    try {
      if (typeof window !== 'undefined' && 'matchMedia' in window) {
        system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {}

    const initial = saved ?? system;
    setTheme(initial);

    // Explicitly add/remove on <html> and <body>
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.body?.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body?.classList.remove('dark');
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body?.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body?.classList.remove('dark');
    }

    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Optional: avoid any mismatch if the pre-hydration script is blocked
  if (!mounted) return null;

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);