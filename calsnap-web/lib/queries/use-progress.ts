'use client';

import { useMemo } from 'react';
import { copy } from '@/lib/copy';
import {
  chartAccessibilitySummary,
  deriveProgressStats,
  progressAccessibilityValue,
} from '@/lib/progress/progress-stats';
import { useAllWeighIns } from '@/lib/queries/use-all-weigh-ins';
import { useProfile } from '@/lib/queries/use-profile';
import { formatWeight, kgToLbs } from '@/lib/utilities/unit-formatters';

export function useProgress(uid: string | undefined, referenceDate: Date = new Date()) {
  const profileQuery = useProfile(uid);
  const weighInsQuery = useAllWeighIns(uid);

  const profile = profileQuery.data?.profile ?? null;
  const useLbs = profileQuery.data?.extras?.useLbsForWeight ?? false;
  const weighIns = useMemo(
    () => weighInsQuery.data ?? [],
    [weighInsQuery.data],
  );

  const stats = useMemo(() => {
    if (!profile) {
      return null;
    }
    return deriveProgressStats(profile, weighIns, referenceDate);
  }, [profile, weighIns, referenceDate]);

  const formatWeightDisplay = (kg: number) => formatWeight(kg, useLbs);

  const formatWeeklyRate = (): string => {
    if (!stats?.weeklyRateKg) {
      return copy('progress.stats.logMore');
    }
    if (useLbs) {
      return copy('progress.stats.weeklyRateLbs', {
        rate: kgToLbs(stats.weeklyRateKg).toFixed(1),
      });
    }
    return copy('progress.stats.weeklyRateKg', {
      rate: stats.weeklyRateKg.toFixed(1),
    });
  };

  const formatProjectedGoalDate = (): string => {
    if (!profile) {
      return copy('common.unavailable');
    }
    if (!stats?.projectedGoalDate) {
      return profile.deficitKcal === 0
        ? copy('progress.stats.maintaining')
        : copy('common.unavailable');
    }
    return stats.projectedGoalDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const chartAriaLabel =
    profile && stats
      ? chartAccessibilitySummary(
          weighIns,
          stats.currentWeightKg,
          profile.startingWeightKg,
          profile.goalWeightKg,
          formatWeightDisplay,
        )
      : copy('progress.chart.a11y.label');

  const progressAriaValue = stats
    ? progressAccessibilityValue(stats.progressFraction)
    : copy('progress.bar.a11y', { percent: 0 });

  const isLoading = profileQuery.isLoading || weighInsQuery.isLoading;
  const profileLoadFailed =
    !isLoading && (profileQuery.isError || (profileQuery.isSuccess && !profile));
  const error =
    profileQuery.error ?? weighInsQuery.error ?? null;

  return {
    isLoading,
    profileLoadFailed,
    error,
    profile,
    profileExtras: profileQuery.data?.extras ?? null,
    useLbs,
    weighIns,
    stats,
    formatWeightDisplay,
    formatWeeklyRate,
    formatProjectedGoalDate,
    chartAriaLabel,
    progressAriaValue,
  };
}
