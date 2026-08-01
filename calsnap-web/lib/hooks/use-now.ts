'use client';

import { useEffect, useState } from 'react';
import { localDayKey, msUntilNextLocalMidnight } from '@/lib/dashboard/date-window';

const MIDNIGHT_BUFFER_MS = 1000;

export function useNow(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnightRollover = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = setTimeout(
        () => setNow(new Date()),
        msUntilNextLocalMidnight(now) + MIDNIGHT_BUFFER_MS,
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNow((current) =>
          localDayKey(new Date()) === localDayKey(current) ? current : new Date(),
        );
      }
    };

    scheduleMidnightRollover();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [now]);

  return now;
}
