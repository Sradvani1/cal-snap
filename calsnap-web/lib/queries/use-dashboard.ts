'use client';

import { useMemo } from 'react';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import {
  calorieProgress,
  calorieProgressBand,
  fiberProgressBand,
  fiberProgressRatio,
  fiberTargetForDailyCalories,
  netCalorieSummary,
  netCalorieDelta,
  remainingCalories,
} from '@/lib/dashboard/calorie-progress';
import { dashboardFormattedDate, dashboardGreeting } from '@/lib/dashboard/greeting';
import { macroTargets, macroPercents } from '@/lib/nutrition/calculator';
import { useProfile } from '@/lib/queries/use-profile';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';

export function useDashboard(uid: string | undefined) {
  const now = useMemo(() => new Date(), []);
  const profileQuery = useProfile(uid);
  const mealsQuery = useTodaysMeals(uid, now);

  const profile = profileQuery.data?.profile ?? null;

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

  const actualMacroPercents = macroPercents(
    aggregation.todaysProteinG,
    aggregation.todaysCarbsG,
    aggregation.todaysFatG,
  );
  const targetMacroPercents = profile
    ? {
        proteinPct: Math.round(profile.macroTargetProteinPct * 100),
        carbsPct: Math.round(profile.macroTargetCarbsPct * 100),
        fatPct: Math.round(profile.macroTargetFatPct * 100),
      }
    : { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  const netDelta = netCalorieDelta(consumed, target);

  const isLoading =
    profileQuery.isLoading || mealsQuery.isLoading;
  const profileLoadFailed =
    !isLoading && (profileQuery.isError || (profileQuery.isSuccess && !profile));
  const error =
    profileQuery.error ?? mealsQuery.error ?? null;

  return {
    isLoading,
    profileLoadFailed,
    error,
    profile,
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
    netCalorieDelta: netDelta,
    actualMacroPercents,
    targetMacroPercents,
  };
}
