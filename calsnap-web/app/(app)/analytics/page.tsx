'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import {
  AnalyticsDateRange,
  normalizeCustomRange,
  presetToDateRange,
  type AnalyticsTimeframePreset,
} from '@/lib/analytics/analytics-types';
import { useAnalytics } from '@/lib/queries/use-analytics';
import { useGenerateInsight } from '@/lib/queries/use-generate-insight';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { AnalyticsCustomRangeSheet } from '@/components/analytics/AnalyticsCustomRangeSheet';
import { AnalyticsEmptyState } from '@/components/analytics/AnalyticsEmptyState';
import { AnalyticsInsightCard } from '@/components/analytics/AnalyticsInsightCard';
import {
  AnalyticsSectionCard,
  AnalyticsSectionCardSkeleton,
} from '@/components/analytics/AnalyticsSectionCard';
import { AnalyticsTimeframePicker } from '@/components/analytics/AnalyticsTimeframePicker';
import { CalorieAdherenceSection } from '@/components/analytics/CalorieAdherenceSection';
import { FiberSection } from '@/components/analytics/FiberSection';
import { MacroTrendsSection } from '@/components/analytics/MacroTrendsSection';
import { PatternsSection } from '@/components/analytics/PatternsSection';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { WeighInSheet } from '@/components/progress/WeighInSheet';
import { WeightProgressView } from '@/components/progress/WeightProgressView';

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

  const clearInsight = useCallback(() => {
    setInsightState(null);
    setInsightError(null);
  }, []);

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
      setInsightState(null);
      setInsightError(
        error instanceof Error ? error.message : 'Failed to generate insight',
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
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">Analytics</h1>

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
            <AnalyticsSectionCardSkeleton />
            <AnalyticsSectionCardSkeleton />
            <AnalyticsSectionCardSkeleton />
          </div>
        )}

        {analyticsQuery.isError && (
          <SessionErrorBanner
            message={
              analyticsQuery.error instanceof Error
                ? analyticsQuery.error.message
                : 'Failed to load analytics'
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
              <AnalyticsEmptyState />
            )}
          </div>
        )}

        {uid && (
          <div className={`flex flex-col gap-6 ${snapshot || analyticsQuery.isLoading ? 'mt-6' : ''}`}>
            <AnalyticsSectionCard title="Weight progress">
              <WeightProgressView
                uid={uid}
                presentation="embedded"
                onLogWeighIn={() => setShowWeighInSheet(true)}
              />
            </AnalyticsSectionCard>
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
