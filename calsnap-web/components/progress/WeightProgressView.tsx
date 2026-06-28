'use client';

import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
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
import { useProgress } from '@/lib/queries/use-progress';

interface WeightProgressViewProps {
  uid: string;
  onLogWeighIn: () => void;
}

export function WeightProgressView({ uid, onLogWeighIn }: WeightProgressViewProps) {
  const progress = useProgress(uid);

  if (progress.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <WeightProgressHeaderSkeleton />
        <WeightProgressBarSkeleton />
        <WeightProgressChartSkeleton />
        <WeightProgressStatsGridSkeleton />
        <WeighInHistoryListSkeleton />
      </div>
    );
  }

  if (progress.profileLoadFailed || !progress.profile || !progress.stats) {
    return (
      <SessionErrorBanner
        message={
          progress.error instanceof Error
            ? progress.error.message
            : 'Could not load your progress.'
        }
      />
    );
  }

  const { profile, stats, useLbs } = progress;

  return (
    <div className="flex flex-col gap-6">
      {progress.error && (
        <SessionErrorBanner
          message={
            progress.error instanceof Error
              ? progress.error.message
              : 'Failed to load progress'
          }
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Progress</h1>
        <button
          type="button"
          onClick={onLogWeighIn}
          className="min-h-11 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Log weigh-in
        </button>
      </div>

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
        goalWeightKg={profile.goalWeightKg}
        useLbs={useLbs}
        ariaLabel={progress.chartAriaLabel}
        onLogWeighIn={onLogWeighIn}
      />

      <WeightProgressStatsGrid
        lostSoFarLabel={progress.formatWeightDisplay(stats.lostSoFarKg)}
        toGoalLabel={progress.formatWeightDisplay(stats.toGoalKg)}
        weeklyRateLabel={progress.formatWeeklyRate()}
        projectedDateLabel={progress.formatProjectedGoalDate()}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">History</h2>
        <WeighInHistoryList weighIns={progress.weighIns} useLbs={useLbs} />
      </section>
    </div>
  );
}
