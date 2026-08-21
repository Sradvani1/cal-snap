'use client';

import { useEffect } from 'react';
import { UsageEvent, type UsageEventName } from '@/lib/usage/events';
import { trackUsageEvent } from '@/lib/usage/client';

const pageEvents: Record<string, UsageEventName> = {
  '/dashboard': UsageEvent.DashboardViewed,
  '/log': UsageEvent.LogViewed,
  '/scan': UsageEvent.ScanViewed,
  '/progress': UsageEvent.ProgressViewed,
  '/analytics': UsageEvent.AnalyticsViewed,
  '/settings': UsageEvent.SettingsViewed,
};

export function appUsageSessionKey(uid: string): string {
  return `calsnap_usage_opened_${uid}`;
}

export function useAppUsage(pathname: string, uid: string | undefined, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !uid) {
      return;
    }

    const sessionKey = appUsageSessionKey(uid);
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      void trackUsageEvent(UsageEvent.AppOpened);
    }

    const event = pageEvents[pathname];
    if (event) {
      void trackUsageEvent(event);
    }
  }, [enabled, pathname, uid]);
}
