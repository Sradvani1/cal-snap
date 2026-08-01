'use client';

import { useMemo } from 'react';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { dashboardFormattedDate, dashboardGreeting } from '@/lib/dashboard/greeting';
import { AppConstants } from '@/lib/constants';
import { macroTargets } from '@/lib/nutrition/calculator';
import { useProfile } from '@/lib/queries/use-profile';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';
import { useNow } from '@/lib/hooks/use-now';

export function useDashboard(uid: string | undefined) {
  const now = useNow();
  const profileQuery = useProfile(uid);
  const mealsQuery = useTodaysMeals(uid, now);

  const profile = profileQuery.data?.profile ?? null;

  const aggregation = useMemo(
    () => aggregateTodaysMeals(mealsQuery.data ?? []),
    [mealsQuery.data],
  );

  const target = profile?.dailyCalorieTarget ?? 0;
  const ringSegments = [
    { calories: aggregation.todaysProteinG * AppConstants.Nutrition.proteinCalPerGram,               macro: 'protein' as const },
    { calories: Math.max(0, aggregation.todaysCarbsG) * AppConstants.Nutrition.carbsCalPerGram, macro: 'carbs' as const },
    { calories: aggregation.todaysSaturatedFatG * AppConstants.Nutrition.fatCalPerGram,        macro: 'saturatedFat' as const },
    { calories: aggregation.todaysUnsaturatedFatG * AppConstants.Nutrition.fatCalPerGram,      macro: 'unsaturatedFat' as const },
    { calories: aggregation.todaysFiberG * AppConstants.Nutrition.fiberCalPerGram,              macro: 'fiber' as const },
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
    consumedCalories: aggregation.todaysCalories,
    ringSegments,
    macros,
    fiberConsumed: aggregation.todaysFiberG,
    saturatedFatConsumed: aggregation.todaysSaturatedFatG,
    unsaturatedFatConsumed: aggregation.todaysUnsaturatedFatG,
    proteinConsumed: aggregation.todaysProteinG,
    carbsConsumed: Math.max(0, aggregation.todaysCarbsG),
    mealsByType: aggregation.mealsByType,
  };
}
