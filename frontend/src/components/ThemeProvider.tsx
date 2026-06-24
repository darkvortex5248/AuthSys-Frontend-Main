'use client';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accent } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    root.setAttribute('data-accent', accent);

    const isDark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        root.classList.toggle('light', !e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, accent, mounted]);

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
