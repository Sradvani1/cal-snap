import {
  adherencePercent,
  averageDailyCalories,
  chartDailySeries,
  dayOfWeekBreakdown,
  daysMeetingFiberTarget,
  loggedDailySummaries,
  macroSplit,
  timeOfDayBreakdown,
  topFoods,
  weekendWeekdayAverages,
} from '@/lib/analytics/analytics-aggregator';
import {
  AnalyticsDateRange,
  type AnalyticsDateRange as AnalyticsDateRangeType,
  type AnalyticsInsightPayload,
  type DailyNutritionSummary,
  type TimeOfDayBucket,
  type TopFoodEntry,
  type Weekday,
} from '@/lib/analytics/analytics-types';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MacroSplit } from '@/lib/models/macro-split';
import type { UserProfile } from '@/lib/models/user-profile';
import type { WeighIn } from '@/lib/models/weigh-in';
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
  dayOfWeekBreakdown: Record<Weekday, number>;
  timeOfDayBreakdown: Record<TimeOfDayBucket, number>;
  topFoods: TopFoodEntry[];
  weekendAverageCalories: number | null;
  weekdayAverageCalories: number | null;
  insightPayload: AnalyticsInsightPayload;
}

export interface BuildAnalyticsSnapshotInput {
  meals: MealEntry[];
  profile: UserProfile;
  range: AnalyticsDateRangeType;
  weighInsInRange: WeighIn[];
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
  const rangeStart = AnalyticsDateRange.resolvedStart(input.range, referenceDate);
  const rangeEnd = AnalyticsDateRange.resolvedEnd(input.range, referenceDate);

  const loggedDays = loggedDailySummaries(input.meals);
  const chartSeries = chartDailySeries(loggedDays, rangeStart, rangeEnd);
  const loggedDayCount = loggedDays.length;
  const hasEnoughData = loggedDayCount >= 3;
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
  const dowBreakdown = dayOfWeekBreakdown(input.meals);
  const todBreakdown = timeOfDayBreakdown(input.meals);
  const topFoodEntries = topFoods(input.meals, 5);

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
    input.weighInsInRange,
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
    dayOfWeekBreakdown: dowBreakdown,
    timeOfDayBreakdown: todBreakdown,
    topFoods: topFoodEntries,
    weekendAverageCalories,
    weekdayAverageCalories,
    insightPayload,
  };
}
