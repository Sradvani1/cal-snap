'use client';

import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { PrimaryButton } from '@/components/design/PrimaryButton';
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
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
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
            : copy('progress.error.loadFailed')
        }
      />
    );
  }

  const { profile, stats, useLbs } = progress;
  const isEmbedded = presentation === 'embedded';

  return (
    <div className="flex flex-col gap-6">
      {progress.error && (
        <SessionErrorBanner
          message={
            progress.error instanceof Error
              ? progress.error.message
              : copy('progress.error.partialLoad')
          }
        />
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
