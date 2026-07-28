'use client';
import { InlineErrorMessage } from '@/components/design/InlineErrorMessage';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import {
  CumulativeBalanceChart,
  CumulativeBalanceChartSkeleton,
} from '@/components/progress/CumulativeBalanceChart';
import {
  WeightProgressBar,
  WeightProgressBarSkeleton,
} from '@/components/progress/WeightProgressBar';
import {
  WeightProgressChart,
  WeightProgressChartSkeleton,
} from '@/components/progress/WeightProgressChart';
import {
  WeightProgressHeader,
  WeightProgressHeaderSkeleton,
} from '@/components/progress/WeightProgressHeader';
import {
  WeightProgressStatsGrid,
  WeightProgressStatsGridSkeleton,
} from '@/components/progress/WeightProgressStatsGrid';
import {
  WeighInHistoryList,
  WeighInHistoryListSkeleton,
} from '@/components/progress/WeighInHistoryList';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { useDailyCalorieSummaries } from '@/lib/queries/use-daily-calorie-summaries';
import { useProgress } from '@/lib/queries/use-progress';

interface WeightProgressViewProps {
  uid: string;
  onLogWeighIn: () => void;
  presentation?: 'full' | 'embedded';
}

export function WeightProgressView({
  uid,
  onLogWeighIn,
  presentation = 'full',
}: WeightProgressViewProps) {
  const progress = useProgress(uid);

  const today = startOfLocalDay(new Date());
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1);

  const startDate = progress.weighIns.length > 0
    ? startOfLocalDay(progress.weighIns[progress.weighIns.length - 1].date)
    : new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  const calorieSummariesQuery = useDailyCalorieSummaries(uid, startDate, endDate);

  if (progress.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <WeightProgressHeaderSkeleton />
        <WeightProgressBarSkeleton />
        <WeightProgressChartSkeleton />
        <CumulativeBalanceChartSkeleton />
        <WeightProgressStatsGridSkeleton />
        <WeighInHistoryListSkeleton />
      </div>
    );
  }

  if (progress.profileLoadFailed || !progress.profile || !progress.stats) {
    return <InlineErrorMessage message={copy('progress.error.loadFailed')} />;
  }

  const { profile, stats, useLbs } = progress;
  const isEmbedded = presentation === 'embedded';

  return (
    <div className="flex flex-col gap-6">
      {progress.error && (
        <InlineErrorMessage message={copy('progress.error.partialLoad')} />
      )}

      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <h1 className={typography.csCardTitle}>{copy('progress.title')}</h1>
          <PrimaryButton type="button" onClick={onLogWeighIn} className="min-h-11">
            {copy('progress.logWeighIn')}
          </PrimaryButton>
        </div>
      )}

      <WeightProgressHeader
        currentWeightKg={stats.currentWeightKg}
        startingWeightKg={profile.startingWeightKg}
        goalWeightKg={profile.goalWeightKg}
        useLbs={useLbs}
      />

      <WeightProgressBar
        progressFraction={stats.progressFraction}
        ariaValueText={progress.progressAriaValue}
      />

      <WeightProgressChart
        weighIns={stats.chartWeighInsAscending}
        projectionPoints={stats.projectionPoints}
        startingWeightKg={profile.startingWeightKg}
        goalWeightKg={profile.goalWeightKg}
        useLbs={useLbs}
        ariaLabel={progress.chartAriaLabel}
        onLogWeighIn={onLogWeighIn}
      />

      <CumulativeBalanceChart
        dailySummaries={calorieSummariesQuery.data ?? []}
        dailyTarget={profile.dailyCalorieTarget}
      />

      <WeightProgressStatsGrid
        lostSoFarLabel={progress.formatWeightDisplay(stats.lostSoFarKg)}
        toGoalLabel={progress.formatWeightDisplay(stats.toGoalKg)}
        weeklyRateLabel={progress.formatWeeklyRate()}
        projectedDateLabel={progress.formatEstimatedGoalDate()}
      />

      <section>
        <h2 className={`${typography.csCardTitle} mb-3`}>{copy('progress.history.title')}</h2>
        <WeighInHistoryList
          weighIns={progress.weighIns}
          useLbs={useLbs}
          onLogWeighIn={onLogWeighIn}
        />
      </section>
    </div>
  );
}
