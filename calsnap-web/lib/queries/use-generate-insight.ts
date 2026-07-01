'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';
import { getFirebaseAuth } from '@/lib/firebase/client';

export function useGenerateInsight() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMutation({
    mutationFn: async (payload: AnalyticsInsightPayload): Promise<string> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) {
        throw new Error(copy('analytics.insight.error'));
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => ({}))) as {
        insight?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(copy('analytics.insight.unavailable'));
        }
        throw new Error(copy('analytics.insight.error'));
      }

      if (!body.insight) {
        throw new Error(copy('analytics.insight.empty'));
      }

      return body.insight;
    },
  });
}
