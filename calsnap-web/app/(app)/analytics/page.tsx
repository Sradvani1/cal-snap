'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { ErrorBoundary } from '@/components/design/ErrorBoundary';
import { InlineErrorMessage } from '@/components/design/InlineErrorMessage';
import { useAuth } from '@/lib/auth/auth-context';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SectionCardSkeleton } from '@/components/design/SectionCard';
import { AnalyticsCustomRangeSheet } from '@/components/analytics/AnalyticsCustomRangeSheet';
import { AnalyticsTimeframePicker } from '@/components/analytics/AnalyticsTimeframePicker';
import { useNow } from '@/lib/hooks/use-now';

import {
  AnalyticsDateRange,
} from '@/lib/analytics/analytics-types';
import { buildAnalyticsSnapshot } from '@/lib/analytics/build-analytics-snapshot';
import { useAnalyticsMeals } from '@/lib/queries/use-analytics-meals';
import { useAnalyticsWeighIns } from '@/lib/queries/use-analytics-weigh-ins';
import { useAnalyticsTimeframe } from '@/lib/queries/use-analytics-timeframe';
import { useProfile } from '@/lib/queries/use-profile';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const CalorieAdherenceSection = dynamic(
  () =>
    import('@/components/analytics/CalorieAdherenceSection').then((m) => ({
      default: m.CalorieAdherenceSection,
    })),
  { ssr: false, loading: () => <SectionCardSkeleton /> },
);

const MacroTrendsSection = dynamic(
  () =>
    import('@/components/analytics/MacroTrendsSection').then((m) => ({
      default: m.MacroTrendsSection,
    })),
  { ssr: false, loading: () => <SectionCardSkeleton /> },
);

const FiberSection = dynamic(
  () =>
    import('@/components/analytics/FiberSection').then((m) => ({
      default: m.FiberSection,
    })),
  { ssr: false, loading: () => <SectionCardSkeleton /> },
);

function AnalyticsContent({ uid }: { uid: string | undefined }) {
  const profileQuery = useProfile(uid);

  const referenceDate = useNow();

  const timeframe = useAnalyticsTimeframe();
  const mealsQuery = useAnalyticsMeals(uid, timeframe.selectedRange, referenceDate);
  const weighInsQuery = useAnalyticsWeighIns(uid, timeframe.selectedRange, referenceDate);

  const profile = profileQuery.data?.profile ?? null;

  const snapshot = useMemo(() => {
    if (!profile || !mealsQuery.data) return null;
    return buildAnalyticsSnapshot({
      meals: mealsQuery.data,
      profile,
      range: timeframe.selectedRange,
      weighInsInRange: weighInsQuery.data ?? [],
      referenceDate,
    });
  }, [profile, mealsQuery.data, weighInsQuery.data, timeframe.selectedRange, referenceDate]);

  const customRangeStart =
    timeframe.selectedRange.kind === 'custom'
      ? timeframe.selectedRange.start
      : AnalyticsDateRange.resolvedStart(timeframe.selectedRange, referenceDate);
  const customRangeEnd =
    timeframe.selectedRange.kind === 'custom'
      ? timeframe.selectedRange.end
      : AnalyticsDateRange.resolvedEnd(timeframe.selectedRange, referenceDate);

  const isInitialLoad = profileQuery.isLoading || (mealsQuery.isLoading && !snapshot);
  const hasFatalError = (profileQuery.isError || mealsQuery.isError) && !snapshot;

  return (
    <>
      <div className={cn(layout.pageShell, 'py-8', layout.content.bottomPadding)}>
        <h1 className={`${typography.csCardTitle} mb-6 text-2xl`}>{copy('analytics.title')}</h1>

        <div className="mb-6">
          <AnalyticsTimeframePicker
            selectedPreset={timeframe.timeframePreset}
            onPresetChange={timeframe.handlePresetChange}
          />
        </div>

        {hasFatalError && (
          <InlineErrorMessage message={copy('analytics.error.loadFailed')} />
        )}

        {!hasFatalError && isInitialLoad && (
          <div className="flex flex-col gap-6">
            <SectionCardSkeleton />
            <SectionCardSkeleton />
            <SectionCardSkeleton />
          </div>
        )}

        {!isInitialLoad && snapshot && (
          <div className="flex flex-col gap-6">
            {snapshot.hasEnoughData ? (
              <>
                <ErrorBoundary>
                  <CalorieAdherenceSection
                    chartDailySeries={snapshot.chartDailySeries}
                    calorieTarget={snapshot.calorieTarget}
                    averageDailyCalories={snapshot.averageDailyCalories}
                    adherencePct={snapshot.adherencePct}
                  />
                </ErrorBoundary>
                <ErrorBoundary>
                  <MacroTrendsSection
                    chartDailySeries={snapshot.chartDailySeries}
                    calorieTarget={snapshot.calorieTarget}
                  />
                </ErrorBoundary>
                <ErrorBoundary>
                  <FiberSection
                    chartDailySeries={snapshot.chartDailySeries}
                    fiberTargetG={snapshot.fiberTargetG}
                    daysMeetingFiberTarget={snapshot.daysMeetingFiberTarget}
                    loggedDayCount={snapshot.loggedDayCount}
                  />
                </ErrorBoundary>
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


      </div>

      {timeframe.customSheetOpen && (
        <AnalyticsCustomRangeSheet
          open={timeframe.customSheetOpen}
          initialStart={customRangeStart}
          initialEnd={customRangeEnd}
          onApply={timeframe.handleCustomApply}
          onClose={timeframe.revertCustomPresetIfNeeded}
        />
      )}

    </>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  return <AnalyticsContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
