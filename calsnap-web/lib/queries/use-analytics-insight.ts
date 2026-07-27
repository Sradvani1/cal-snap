'use client';

import { useState, useCallback } from 'react';
import { useGenerateInsight } from '@/lib/queries/use-generate-insight';
import { copy } from '@/lib/copy';
import type { AnalyticsSnapshot } from '@/lib/analytics/build-analytics-snapshot';

export function useAnalyticsInsight(
  snapshot: AnalyticsSnapshot | null | undefined,
  insightContextKey: string,
) {
  const [insightState, setInsightState] = useState<{
    text: string;
    contextKey: string;
  } | null>(null);
  const [insightError, setInsightError] = useState<{
    message: string;
    contextKey: string;
  } | null>(null);

  const generateInsight = useGenerateInsight();

  const insightText =
    insightState?.contextKey === insightContextKey ? insightState.text : null;
  const activeInsightError =
    insightError?.contextKey === insightContextKey ? insightError.message : null;

  const clearInsight = useCallback(() => {
    setInsightState(null);
    setInsightError(null);
  }, []);

  const handleGenerateInsight = useCallback(async () => {
    if (!snapshot?.hasEnoughData) {
      return;
    }
    setInsightError(null);
    try {
      const text = await generateInsight.mutateAsync(snapshot.insightPayload);
      setInsightState({ text, contextKey: insightContextKey });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setInsightState(null);
      setInsightError({
        message:
          error instanceof Error ? error.message : copy('analytics.insight.error'),
        contextKey: insightContextKey,
      });
    }
  }, [snapshot, insightContextKey, generateInsight]);

  return {
    insightText,
    insightError: activeInsightError,
    isGenerating: generateInsight.isPending,
    handleGenerateInsight,
    clearInsight,
  };
}
