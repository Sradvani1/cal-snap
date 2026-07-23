'use client';

import { useMemo } from 'react';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { dashboardFormattedDate, dashboardGreeting } from '@/lib/dashboard/greeting';
import { macroTargets } from '@/lib/nutrition/calculator';
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
  const ringSegments = [
    { calories: aggregation.todaysProteinG * 4,                         macro: 'protein' as const },
    { calories: Math.max(0, aggregation.todaysCarbsG - aggregation.todaysFiberG) * 4, macro: 'carbs' as const },
    { calories: aggregation.todaysSaturatedFatG * 9,                  macro: 'saturatedFat' as const },
    { calories: aggregation.todaysUnsaturatedFatG * 9,                macro: 'unsaturatedFat' as const },
    { calories: aggregation.todaysFiberG * 2,                          macro: 'fiber' as const },
  ].filter(s => s.calories > 0);
  const macros = profile
    ? macroTargets(
        profile.dailyCalorieTarget,
        profile.macroTargetProteinPct,
        profile.macroTargetCarbsPct,
        profile.macroTargetFatPct,
      )
    : { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

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
    target,
    ringSegments,
    macros,
    fiberConsumed: aggregation.todaysFiberG,
    saturatedFatConsumed: aggregation.todaysSaturatedFatG,
    unsaturatedFatConsumed: aggregation.todaysUnsaturatedFatG,
    proteinConsumed: aggregation.todaysProteinG,
    carbsConsumed: Math.max(0, aggregation.todaysCarbsG - aggregation.todaysFiberG),
    mealsByType: aggregation.mealsByType,
  };
}
