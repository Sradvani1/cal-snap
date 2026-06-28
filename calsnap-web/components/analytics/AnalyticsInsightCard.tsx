'use client';

import { PrimaryButton } from '@/components/design/PrimaryButton';
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

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
    <SectionCard title={copy('analytics.section.aiInsight')}>
      <p className={`${typography.csCaption} mb-4`}>
        {copy('analytics.insight.description')}
      </p>

      <PrimaryButton
        type="button"
        onClick={onGenerate}
        disabled={!hasEnoughData || isGenerating}
        className="min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? copy('analytics.insight.generating') : copy('analytics.insight.generate')}
      </PrimaryButton>

      {isGenerating && (
        <div className={`${typography.csCaption} mt-4 flex items-center gap-2`}>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cs-border border-t-cs-foreground" />
          {copy('analytics.insight.analyzing')}
        </div>
      )}

      {insightError && (
        <p className="mt-4 text-sm text-cs-danger" role="alert">
          {insightError}
        </p>
      )}

      {insightText && !isGenerating && (
        <p className={`${typography.csBody} mt-4 leading-relaxed`}>{insightText}</p>
      )}
    </SectionCard>
  );
}
