'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const prefsStr = localStorage.getItem('uacap_settings_preferences');
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr);
        if (prefs.darkModeEnabled) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      console.error('Error applying dark mode preference:', e);
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
