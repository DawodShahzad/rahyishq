'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const trackedSessionRef = useRef<boolean>(false);

  useEffect(() => {
    // Never track visits inside the admin panel
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = 'darulehsan_visited_date';
      const sessionKey = 'darulehsan_visited_session';

      const lastDaily = localStorage.getItem(dailyKey);
      const isUniqueDaily = lastDaily !== today;
      const alreadyTrackedInSession = Boolean(sessionStorage.getItem(sessionKey)) || trackedSessionRef.current;

      // Optimize Cloudflare Worker invocations:
      // If the user is already tracked in this active session and it is NOT a new unique daily visitor,
      // skip calling /api/analytics to preserve Cloudflare's 100k daily worker free limit!
      if (!isUniqueDaily && alreadyTrackedInSession) {
        return;
      }

      trackedSessionRef.current = true;
      sessionStorage.setItem(sessionKey, 'true');
      if (isUniqueDaily) {
        localStorage.setItem(dailyKey, today);
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
      // In case localStorage / sessionStorage is restricted
    }
  }, [pathname]);

  return null;
}
