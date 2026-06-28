'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { executePlateauDietBreak } from '@/lib/dashboard/plateau-actions';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import {
  calorieProgress,
  calorieProgressBand,
  fiberProgressBand,
  fiberProgressRatio,
  fiberTargetForDailyCalories,
  netCalorieSummary,
  remainingCalories,
} from '@/lib/dashboard/calorie-progress';
import { dashboardFormattedDate, dashboardGreeting } from '@/lib/dashboard/greeting';
import {
  applySmallReductionTargets,
  plateauSnoozeEndDate,
  plateauSnoozeKey,
  shouldShowPlateauAlert,
  storeDate,
} from '@/lib/dashboard/plateau-state';
import { macroTargets } from '@/lib/nutrition/calculator';
import { updateCalorieTargets } from '@/lib/repositories/profile';
import { queryKeys } from '@/lib/queries/query-keys';
import { useProfile } from '@/lib/queries/use-profile';
import { useRecentWeighIns } from '@/lib/queries/use-recent-weigh-ins';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';

function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useDashboard(uid: string | undefined) {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const profileQuery = useProfile(uid);
  const mealsQuery = useTodaysMeals(uid, now);
  const weighInsQuery = useRecentWeighIns(uid, now);
  const [plateauDismissed, setPlateauDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const plateauStorageReady = useClientMounted();

  const profile = profileQuery.data?.profile ?? null;
  const useLbsForDisplay = profileQuery.data?.extras?.useLbsForWeight ?? false;

  const aggregation = useMemo(
    () => aggregateTodaysMeals(mealsQuery.data ?? []),
    [mealsQuery.data],
  );

  const target = profile?.dailyCalorieTarget ?? 0;
  const consumed = aggregation.todaysCalories;
  const progress = calorieProgress(consumed, target);
  const band = calorieProgressBand(progress);
  const remaining = remainingCalories(consumed, target);
  const macros = profile
    ? macroTargets(
        profile.dailyCalorieTarget,
        profile.macroTargetProteinPct,
        profile.macroTargetCarbsPct,
        profile.macroTargetFatPct,
      )
    : { proteinG: 0, carbsG: 0, fatG: 0 };
  const fiberTarget = fiberTargetForDailyCalories(target);
  const fiberRatio = fiberProgressRatio(aggregation.todaysFiberG, target);
  const fiberBand = fiberProgressBand(fiberRatio);

  const chartWeighIns = weighInsQuery.data?.chartWeighIns ?? [];
  const plateauWeighIns = weighInsQuery.data?.plateauWeighIns ?? [];

  const showPlateauAlert =
    plateauStorageReady &&
    !plateauDismissed &&
    shouldShowPlateauAlert(profile, plateauWeighIns, uid ?? '', now);

  const isLoading =
    profileQuery.isLoading || mealsQuery.isLoading || weighInsQuery.isLoading;
  const profileLoadFailed =
    !isLoading && (profileQuery.isError || (profileQuery.isSuccess && !profile));
  const error =
    profileQuery.error ??
    mealsQuery.error ??
    weighInsQuery.error ??
    (actionError ? new Error(actionError) : null);

  const invalidateProfile = useCallback(async () => {
    if (!uid) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
  }, [queryClient, uid]);

  const applyDietBreak = useCallback(async () => {
    if (!uid || !profile) {
      return;
    }
    setActionError(null);
    const result = await executePlateauDietBreak(uid, profile, updateCalorieTargets);
    if (result.ok) {
      setPlateauDismissed(true);
      await invalidateProfile();
    } else {
      setActionError(result.error);
    }
  }, [uid, profile, invalidateProfile]);

  const applySmallReduction = useCallback(async () => {
    if (!uid || !profile) {
      return;
    }
    setActionError(null);
    const updated = applySmallReductionTargets(profile);
    try {
      await updateCalorieTargets(uid, {
        dailyCalorieTarget: updated.dailyCalorieTarget,
        deficitKcal: updated.deficitKcal,
      });
      setPlateauDismissed(true);
      await invalidateProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  }, [uid, profile, invalidateProfile]);

  const dismissPlateauAlert = useCallback(() => {
    if (uid) {
      storeDate(plateauSnoozeKey(uid), plateauSnoozeEndDate());
    }
    setPlateauDismissed(true);
  }, [uid]);

  return {
    isLoading,
    profileLoadFailed,
    error,
    profile,
    useLbsForDisplay,
    greeting: dashboardGreeting(profile?.name, now),
    formattedDate: dashboardFormattedDate(now),
    consumed,
    target,
    remaining,
    progress,
    band,
    macros,
    fiberTarget,
    fiberBand,
    fiberRatio,
    fiberConsumed: aggregation.todaysFiberG,
    proteinConsumed: aggregation.todaysProteinG,
    carbsConsumed: aggregation.todaysCarbsG,
    fatConsumed: aggregation.todaysFatG,
    mealsByType: aggregation.mealsByType,
    netSummary: netCalorieSummary(consumed, target),
    chartWeighIns,
    startingWeightKg: profile?.startingWeightKg ?? 0,
    showPlateauAlert,
    applyDietBreak,
    applySmallReduction,
    dismissPlateauAlert,
  };
}
