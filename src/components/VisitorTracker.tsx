'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const trackedPageRef = useRef<string | null>(null);

  useEffect(() => {
    // Never track visits inside the admin panel
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    // Prevent duplicate firing for same route within same render cycle
    if (trackedPageRef.current === pathname) {
      return;
    }
    trackedPageRef.current = pathname;

    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = 'darulehsan_visited_date';
      const lastVisited = localStorage.getItem(storageKey);
      const isUniqueDaily = lastVisited !== today;

      if (isUniqueDaily) {
        localStorage.setItem(storageKey, today);
      }

      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isUniqueDaily,
          page: pathname,
        }),
      }).catch(() => {});
    } catch {
      // In case localStorage is blocked in private browsing
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isUniqueDaily: false,
          page: pathname,
        }),
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
