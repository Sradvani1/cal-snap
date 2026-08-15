import {
  adherencePercent,
  averageDailyCalories,
  chartDailySeries,
  daysMeetingFiberTarget,
  loggedDailySummaries,
  macroSplit,
  topFoods,
} from '@/lib/analytics/analytics-aggregator';
import {
  ANALYTICS_MIN_LOGGED_DAYS,
  analyticsWindow,
  type AnalyticsDateRange as AnalyticsDateRangeType,
  type DailyNutritionSummary,
  type TopFoodEntry,
} from '@/lib/analytics/analytics-types';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MacroSplit } from '@/lib/models/macro-split';
import type { UserProfile } from '@/lib/models/user-profile';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { fiberTargetG } from '@/lib/nutrition/calculator';

export interface AnalyticsSnapshot {
  rangeStart: Date;
  rangeEnd: Date;
  loggedDays: DailyNutritionSummary[];
  chartDailySeries: DailyNutritionSummary[];
  loggedDayCount: number;
  hasEnoughLoggedDays: boolean;
  calorieTarget: number;
  adherencePct: number;
  averageDailyCalories: number;
  actualMacroSplit: MacroSplit;
  targetMacroSplit: MacroSplit;
  fiberTargetG: number;
  daysMeetingFiberTarget: number;
  topFoods: TopFoodEntry[];
}

export interface BuildAnalyticsSnapshotInput {
  meals: MealEntry[];
  profile: UserProfile;
  range: AnalyticsDateRangeType;
  referenceDate?: Date;
}

export function buildAnalyticsSnapshot(
  input: BuildAnalyticsSnapshotInput,
): AnalyticsSnapshot {
  const referenceDate = input.referenceDate ?? new Date();
  const { start: rangeStart, end: rangeEnd } = analyticsWindow(input.range, referenceDate);

  const meals = input.meals.filter((m) => {
    const day = startOfLocalDay(m.timestamp);
    return day.getTime() >= rangeStart.getTime() && day.getTime() <= rangeEnd.getTime();
  });

  const loggedDays = loggedDailySummaries(meals);
  const chartSeries = chartDailySeries(loggedDays, rangeStart, rangeEnd);
  const loggedDayCount = loggedDays.length;
  const hasEnoughLoggedDays = loggedDayCount >= ANALYTICS_MIN_LOGGED_DAYS;
  const calorieTarget = input.profile.dailyCalorieTarget;

  const adherencePct = adherencePercent(loggedDays, calorieTarget);
  const averageDailyCaloriesValue = Math.round(averageDailyCalories(loggedDays));

  const totalProtein = loggedDays.reduce((sum, day) => sum + day.proteinG, 0);
  const totalCarbs = loggedDays.reduce((sum, day) => sum + day.carbsG, 0);
  const totalFat = loggedDays.reduce((sum, day) => sum + day.fatG, 0);
  const actualMacroSplit = macroSplit(totalProtein, totalCarbs, totalFat);
  const targetMacroSplit: MacroSplit = {
    proteinPct: Math.round(input.profile.macroTargetProteinPct * 100),
    carbsPct: Math.round(input.profile.macroTargetCarbsPct * 100),
    fatPct: Math.round(input.profile.macroTargetFatPct * 100),
  };

  const fiberTarget = fiberTargetG(calorieTarget);
  const daysMeetingFiber = daysMeetingFiberTarget(loggedDays, fiberTarget);
  const topFoodEntries = topFoods(meals, 5);

  return {
    rangeStart,
    rangeEnd,
    loggedDays,
    chartDailySeries: chartSeries,
    loggedDayCount,
    hasEnoughLoggedDays,
    calorieTarget,
    adherencePct,
    averageDailyCalories: averageDailyCaloriesValue,
    actualMacroSplit,
    targetMacroSplit,
    fiberTargetG: fiberTarget,
    daysMeetingFiberTarget: daysMeetingFiber,
    topFoods: topFoodEntries,
  };
}
