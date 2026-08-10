import {
  adherencePercent,
  averageDailyCalories,
  chartDailySeries,
  daysMeetingFiberTarget,
  loggedDailySummaries,
  macroSplit,
  topFoods,
  weekendWeekdayAverages,
} from '@/lib/analytics/analytics-aggregator';
import {
  AnalyticsDateRange,
  ANALYTICS_MIN_INSIGHT_LOGGED_DAYS,
  type AnalyticsDateRange as AnalyticsDateRangeType,
  type AnalyticsInsightPayload,
  type DailyNutritionSummary,
  type TopFoodEntry,
} from '@/lib/analytics/analytics-types';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MacroSplit } from '@/lib/models/macro-split';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { fiberTargetG } from '@/lib/nutrition/calculator';
import { compareWeighInsChronological } from '@/lib/progress/progress-stats';

export interface AnalyticsSnapshot {
  rangeStart: Date;
  rangeEnd: Date;
  loggedDays: DailyNutritionSummary[];
  chartDailySeries: DailyNutritionSummary[];
  loggedDayCount: number;
  hasEnoughData: boolean;
  calorieTarget: number;
  adherencePct: number;
  averageDailyCalories: number;
  actualMacroSplit: MacroSplit;
  targetMacroSplit: MacroSplit;
  fiberTargetG: number;
  daysMeetingFiberTarget: number;
  topFoods: TopFoodEntry[];
  insightPayload: AnalyticsInsightPayload;
}

export interface BuildAnalyticsSnapshotInput {
  meals: MealEntry[];
  profile: UserProfile;
  range: AnalyticsDateRangeType;
  weighInsInRange?: WeighIn[];
  referenceDate?: Date;
}

function buildInsightPayload(
  profile: UserProfile,
  range: AnalyticsDateRangeType,
  loggedDays: DailyNutritionSummary[],
  loggedDayCount: number,
  adherencePct: number,
  averageDailyCaloriesValue: number,
  actualMacroSplit: MacroSplit,
  targetMacroSplit: MacroSplit,
  fiberTarget: number,
  weekendAverageCalories: number | null,
  weekdayAverageCalories: number | null,
  topFoodEntries: TopFoodEntry[],
  weighInsInRange: WeighIn[],
): AnalyticsInsightPayload {
  const averageFiber = loggedDays.length
    ? loggedDays.reduce((sum, day) => sum + day.fiberG, 0) / loggedDays.length
    : 0;

  let weightChangeKg: number | null = null;
  if (weighInsInRange.length >= 2) {
    const sorted = [...weighInsInRange].sort(compareWeighInsChronological);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first && last) {
      weightChangeKg = last.weightKg - first.weightKg;
    }
  }

  return {
    timeframeLabel: AnalyticsDateRange.displayLabel(range),
    loggedDayCount,
    averageDailyCalories: averageDailyCaloriesValue,
    calorieTarget: profile.dailyCalorieTarget,
    adherencePercent: adherencePct,
    actualMacroSplit,
    targetMacroSplit,
    averageDailyFiberG: averageFiber,
    fiberTargetG: fiberTarget,
    weekendAverageCalories,
    weekdayAverageCalories,
    topFoods: topFoodEntries.slice(0, 3),
    weightChangeKg,
  };
}

export function buildAnalyticsSnapshot(
  input: BuildAnalyticsSnapshotInput,
): AnalyticsSnapshot {
  const referenceDate = input.referenceDate ?? new Date();
  const weighInsInRange = input.weighInsInRange ?? [];
  let rangeStart = AnalyticsDateRange.resolvedStart(input.range, referenceDate);
  let rangeEnd = AnalyticsDateRange.resolvedEnd(input.range, referenceDate);

  const today = startOfLocalDay(referenceDate);
  if (rangeEnd.getTime() >= today.getTime()) {
    rangeEnd = new Date(rangeEnd);
    rangeEnd.setDate(rangeEnd.getDate() - 1);
    if (input.range.kind === 'days') {
      const newStart = new Date(rangeEnd);
      newStart.setDate(newStart.getDate() - (input.range.count - 1));
      rangeStart = startOfLocalDay(newStart);
    }
  }

  const meals = input.meals.filter((m) => {
    const day = startOfLocalDay(m.timestamp);
    return day.getTime() >= rangeStart.getTime() && day.getTime() <= rangeEnd.getTime();
  });

  const loggedDays = loggedDailySummaries(meals);
  const chartSeries = chartDailySeries(loggedDays, rangeStart, rangeEnd);
  const loggedDayCount = loggedDays.length;
  const hasEnoughData = loggedDayCount >= ANALYTICS_MIN_INSIGHT_LOGGED_DAYS;
  const calorieTarget = input.profile.dailyCalorieTarget;

  const adherencePct = adherencePercent(chartSeries, calorieTarget);
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

  const weekendWeekday = weekendWeekdayAverages(loggedDays);
  const weekendAverageCalories = weekendWeekday
    ? Math.round(weekendWeekday.weekend)
    : null;
  const weekdayAverageCalories = weekendWeekday
    ? Math.round(weekendWeekday.weekday)
    : null;

  const insightPayload = buildInsightPayload(
    input.profile,
    input.range,
    loggedDays,
    loggedDayCount,
    adherencePct,
    averageDailyCaloriesValue,
    actualMacroSplit,
    targetMacroSplit,
    fiberTarget,
    weekendAverageCalories,
    weekdayAverageCalories,
    topFoodEntries,
    weighInsInRange,
  );

  return {
    rangeStart,
    rangeEnd,
    loggedDays,
    chartDailySeries: chartSeries,
    loggedDayCount,
    hasEnoughData,
    calorieTarget,
    adherencePct,
    averageDailyCalories: averageDailyCaloriesValue,
    actualMacroSplit,
    targetMacroSplit,
    fiberTargetG: fiberTarget,
    daysMeetingFiberTarget: daysMeetingFiber,
    topFoods: topFoodEntries,
    insightPayload,
  };
}
