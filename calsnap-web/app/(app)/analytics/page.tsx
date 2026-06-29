'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { AnalyticsCustomRangeSheet } from '@/components/analytics/AnalyticsCustomRangeSheet';
import { AnalyticsInsightCard } from '@/components/analytics/AnalyticsInsightCard';
import { AnalyticsTimeframePicker } from '@/components/analytics/AnalyticsTimeframePicker';
import { CalorieAdherenceSection } from '@/components/analytics/CalorieAdherenceSection';
import { FiberSection } from '@/components/analytics/FiberSection';
import { MacroTrendsSection } from '@/components/analytics/MacroTrendsSection';
import { PatternsSection } from '@/components/analytics/PatternsSection';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { WeighInSheet } from '@/components/progress/WeighInSheet';
import { WeightProgressView } from '@/components/progress/WeightProgressView';
import {
  AnalyticsDateRange,
  normalizeCustomRange,
  presetToDateRange,
  type AnalyticsTimeframePreset,
} from '@/lib/analytics/analytics-types';
import { useAnalytics } from '@/lib/queries/use-analytics';
import { useGenerateInsight } from '@/lib/queries/use-generate-insight';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

function AnalyticsContent({ uid }: { uid: string | undefined }) {
  const plateau = usePlateauAlert(uid);
  const profileQuery = useProfile(uid);
  const [timeframePreset, setTimeframePreset] = useState<AnalyticsTimeframePreset>('7D');
  const [selectedRange, setSelectedRange] = useState(() => AnalyticsDateRange.days(7));
  const [presetBeforeCustom, setPresetBeforeCustom] = useState<AnalyticsTimeframePreset>('7D');
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [showWeighInSheet, setShowWeighInSheet] = useState(false);
  const [insightState, setInsightState] = useState<{
    text: string;
    contextKey: string;
  } | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const analyticsQuery = useAnalytics(uid, selectedRange);
  const generateInsight = useGenerateInsight();

  const profile = profileQuery.data?.profile;
  const profileExtras = profileQuery.data?.extras;
  const snapshot = analyticsQuery.data?.snapshot;

  const insightContextKey = profile
    ? `${profile.dailyCalorieTarget}-${profile.updatedAt.getTime()}`
    : '';
  const insightText =
    insightState?.contextKey === insightContextKey ? insightState.text : null;

  const clearInsight = () => {
    setInsightState(null);
    setInsightError(null);
  };

  const handlePresetChange = (preset: AnalyticsTimeframePreset) => {
    if (preset === 'custom') {
      setPresetBeforeCustom(timeframePreset === 'custom' ? '7D' : timeframePreset);
      setTimeframePreset('custom');
      setCustomSheetOpen(true);
      return;
    }
    setTimeframePreset(preset);
    setSelectedRange(presetToDateRange(preset));
    clearInsight();
  };

  const revertCustomPresetIfNeeded = () => {
    if (timeframePreset === 'custom') {
      setTimeframePreset(presetBeforeCustom);
      setSelectedRange(presetToDateRange(presetBeforeCustom));
    }
    setCustomSheetOpen(false);
  };

  const handleCustomApply = (start: Date, end: Date) => {
    const normalized = normalizeCustomRange(start, end);
    if (normalized.kind === 'custom') {
      setSelectedRange(normalized);
      setTimeframePreset('custom');
      clearInsight();
    }
    setCustomSheetOpen(false);
  };

  const handleGenerateInsight = async () => {
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
      setInsightError(
        error instanceof Error ? error.message : copy('analytics.insight.error'),
      );
    }
  };

  const customRangeStart =
    selectedRange.kind === 'custom'
      ? selectedRange.start
      : AnalyticsDateRange.resolvedStart(selectedRange);
  const customRangeEnd =
    selectedRange.kind === 'custom'
      ? selectedRange.end
      : AnalyticsDateRange.resolvedEnd(selectedRange);

  return (
    <>
      <div className="mx-auto max-w-lg px-4 py-8 pb-24">
        <h1 className={`${typography.csCardTitle} mb-6 text-2xl`}>{copy('analytics.title')}</h1>

        <div className="mb-6">
          <AnalyticsTimeframePicker
            selectedPreset={timeframePreset}
            onPresetChange={handlePresetChange}
          />
        </div>

        {plateau.actionError && (
          <div className="mb-4">
            <SessionErrorBanner message={plateau.actionError} />
          </div>
        )}

        {analyticsQuery.isLoading && (
          <div className="flex flex-col gap-6">
            <SectionCardSkeleton />
            <SectionCardSkeleton />
            <SectionCardSkeleton />
          </div>
        )}

        {analyticsQuery.isError && (
          <SessionErrorBanner
            message={
              analyticsQuery.error instanceof Error
                ? analyticsQuery.error.message
                : copy('analytics.error.loadFailed')
            }
          />
        )}

        {!analyticsQuery.isLoading && snapshot && (
          <div className="flex flex-col gap-6">
            {snapshot.hasEnoughData ? (
              <>
                <CalorieAdherenceSection
                  chartDailySeries={snapshot.chartDailySeries}
                  calorieTarget={snapshot.calorieTarget}
                  averageDailyCalories={snapshot.averageDailyCalories}
                  adherencePct={snapshot.adherencePct}
                />
                <MacroTrendsSection
                  chartDailySeries={snapshot.chartDailySeries}
                  actualMacroSplit={snapshot.actualMacroSplit}
                  targetMacroSplit={snapshot.targetMacroSplit}
                />
                <FiberSection
                  chartDailySeries={snapshot.chartDailySeries}
                  fiberTargetG={snapshot.fiberTargetG}
                  daysMeetingFiberTarget={snapshot.daysMeetingFiberTarget}
                  loggedDayCount={snapshot.loggedDayCount}
                />
                <PatternsSection
                  dayOfWeekBreakdown={snapshot.dayOfWeekBreakdown}
                  timeOfDayBreakdown={snapshot.timeOfDayBreakdown}
                  weekendAverageCalories={snapshot.weekendAverageCalories}
                  weekdayAverageCalories={snapshot.weekdayAverageCalories}
                  topFoods={snapshot.topFoods}
                />
                <AnalyticsInsightCard
                  hasEnoughData={snapshot.hasEnoughData}
                  insightText={insightText}
                  insightError={insightError}
                  isGenerating={generateInsight.isPending}
                  onGenerate={() => void handleGenerateInsight()}
                />
              </>
            ) : (
              <EmptyStateView
                icon="📊"
                titleKey="analytics.empty.title"
                messageKey="analytics.empty.body"
                actionTitleKey="analytics.empty.action"
                actionHref="/scan"
              />
            )}
          </div>
        )}

        {uid && (
          <div className={`flex flex-col gap-6 ${snapshot || analyticsQuery.isLoading ? 'mt-6' : ''}`}>
            <SectionCard title={copy('analytics.section.weightProgress')}>
              <WeightProgressView
                uid={uid}
                presentation="embedded"
                onLogWeighIn={() => setShowWeighInSheet(true)}
              />
            </SectionCard>
          </div>
        )}
      </div>

      <AnalyticsCustomRangeSheet
        open={customSheetOpen}
        initialStart={customRangeStart}
        initialEnd={customRangeEnd}
        onApply={handleCustomApply}
        onClose={revertCustomPresetIfNeeded}
      />

      {profile && profileExtras && uid && (
        <WeighInSheet
          open={showWeighInSheet}
          uid={uid}
          profile={profile}
          profileExtras={profileExtras}
          onClose={() => setShowWeighInSheet(false)}
          onSaved={() => setShowWeighInSheet(false)}
        />
      )}

      <PlateauAlertSheet
        open={plateau.showPlateauAlert}
        onDietBreak={() => void plateau.applyDietBreak()}
        onSmallReduction={() => void plateau.applySmallReduction()}
        onDismiss={plateau.dismissPlateauAlert}
      />
    </>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  return <AnalyticsContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
