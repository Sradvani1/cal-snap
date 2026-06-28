'use client';

import { AnalyticsSectionCard } from '@/components/analytics/AnalyticsSectionCard';

interface AnalyticsInsightCardProps {
  hasEnoughData: boolean;
  insightText: string | null;
  insightError: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function AnalyticsInsightCard({
  hasEnoughData,
  insightText,
  insightError,
  isGenerating,
  onGenerate,
}: AnalyticsInsightCardProps) {
  return (
    <AnalyticsSectionCard title="AI insight">
      <p className="mb-4 text-sm text-neutral-600">
        Get a short coaching summary based on your aggregated stats — no meal photos sent.
      </p>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!hasEnoughData || isGenerating}
        className="min-h-11 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? 'Generating…' : 'Generate insight'}
      </button>

      {isGenerating && (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          Analyzing your trends…
        </div>
      )}

      {insightError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {insightError}
        </p>
      )}

      {insightText && !isGenerating && (
        <p className="mt-4 text-sm leading-relaxed text-neutral-800">{insightText}</p>
      )}
    </AnalyticsSectionCard>
  );
}
