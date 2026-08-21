'use client';

import { getFirebaseAuth } from '@/lib/firebase/client';
import type { UsageEventName } from '@/lib/usage/events';

export async function trackUsageEvent(event: UsageEventName): Promise<void> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      return;
    }

    const token = await user.getIdToken();
    await fetch('/api/usage-event', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  } catch {
    // Telemetry must never interrupt a user action.
  }
}
