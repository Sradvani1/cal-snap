'use client';

import { useMutation } from '@tanstack/react-query';
import type { AnalyticsInsightPayload } from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';

export function useGenerateInsight() {
  return useMutation({
    mutationFn: async (payload: AnalyticsInsightPayload): Promise<string> => {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => ({}))) as {
        insight?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(copy('analytics.insight.unavailable'));
        }
        throw new Error(body.error ?? copy('analytics.insight.error'));
      }

      if (!body.insight) {
        throw new Error(copy('analytics.insight.empty'));
      }

      return body.insight;
    },
  });
}
