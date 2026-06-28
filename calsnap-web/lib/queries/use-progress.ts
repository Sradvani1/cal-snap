'use client';

import { useMemo } from 'react';
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
      return 'Log more weigh-ins';
    }
    if (useLbs) {
      const lbsPerWeek = kgToLbs(stats.weeklyRateKg);
      return `${lbsPerWeek.toFixed(1)} lbs/week`;
    }
    return `${stats.weeklyRateKg.toFixed(1)} kg/week`;
  };

  const formatProjectedGoalDate = (): string => {
    if (!profile) {
      return '—';
    }
    if (!stats?.projectedGoalDate) {
      return profile.deficitKcal === 0 ? 'Maintaining' : '—';
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
      : 'Weight progress chart';

  const progressAriaValue = stats
    ? progressAccessibilityValue(stats.progressFraction)
    : '0% toward goal';

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
