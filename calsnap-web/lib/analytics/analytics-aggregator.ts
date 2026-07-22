import { isCalorieIntakeOnTarget } from '@/lib/dashboard/calorie-progress';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MacroSplit } from '@/lib/models/macro-split';
import { macroPercents } from '@/lib/nutrition/calculator';
import {
  emptyTimeOfDayBreakdown,
  emptyWeekdayBreakdown,
  isWeekendWeekday,
  timeOfDayBucketForHour,
  toWeekday,
  type DailyNutritionSummary,
  type TimeOfDayBucket,
  type TopFoodEntry,
  type Weekday,
} from '@/lib/analytics/analytics-types';

export function loggedDailySummaries(meals: MealEntry[]): DailyNutritionSummary[] {
  const byDay = new Map<number, DailyNutritionSummary>();

  for (const meal of meals) {
    const day = startOfLocalDay(meal.timestamp);
    const key = day.getTime();
    const existing = byDay.get(key);
    if (existing) {
      byDay.set(key, {
        date: day,
        calories: existing.calories + meal.totalCalories,
        proteinG: existing.proteinG + meal.totalProteinG,
        carbsG: existing.carbsG + meal.totalCarbsG,
        fatG: existing.fatG + meal.totalFatG,
        saturatedFatG: existing.saturatedFatG + meal.totalSaturatedFatG,
        unsaturatedFatG: existing.unsaturatedFatG + meal.totalUnsaturatedFatG,
        fiberG: existing.fiberG + meal.totalFiberG,
      });
    } else {
      byDay.set(key, {
        date: day,
        calories: meal.totalCalories,
        proteinG: meal.totalProteinG,
        carbsG: meal.totalCarbsG,
        fatG: meal.totalFatG,
        saturatedFatG: meal.totalSaturatedFatG,
        unsaturatedFatG: meal.totalUnsaturatedFatG,
        fiberG: meal.totalFiberG,
      });
    }
  }

  return [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function chartDailySeries(
  loggedDays: DailyNutritionSummary[],
  start: Date,
  end: Date,
): DailyNutritionSummary[] {
  const windowStart = startOfLocalDay(start);
  const windowEnd = startOfLocalDay(end);
  if (windowStart.getTime() > windowEnd.getTime()) {
    return [];
  }

  const loggedByDay = new Map(
    loggedDays.map((day) => [startOfLocalDay(day.date).getTime(), day]),
  );
  const series: DailyNutritionSummary[] = [];
  const cursor = new Date(windowStart);

  while (cursor.getTime() <= windowEnd.getTime()) {
    const key = cursor.getTime();
    const logged = loggedByDay.get(key);
    if (logged) {
      series.push(logged);
    } else {
      series.push({
        date: new Date(cursor),
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        saturatedFatG: 0,
        unsaturatedFatG: 0,
        fiberG: 0,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

export function adherencePercent(
  loggedDays: DailyNutritionSummary[],
  calorieTarget: number,
): number {
  if (calorieTarget <= 0 || loggedDays.length === 0) {
    return 0;
  }

  const onTargetCount = loggedDays.filter((day) =>
    isCalorieIntakeOnTarget(day.calories, calorieTarget),
  ).length;
  return (onTargetCount / loggedDays.length) * 100;
}

export function averageDailyCalories(loggedDays: DailyNutritionSummary[]): number {
  if (loggedDays.length === 0) {
    return 0;
  }
  const total = loggedDays.reduce((sum, day) => sum + day.calories, 0);
  return total / loggedDays.length;
}

export function macroSplit(
  proteinG: number,
  carbsG: number,
  fatG: number,
): MacroSplit {
  return macroPercents(proteinG, carbsG, fatG);
}

export function daysMeetingFiberTarget(
  loggedDays: DailyNutritionSummary[],
  fiberTargetG: number,
): number {
  if (fiberTargetG <= 0) {
    return 0;
  }
  return loggedDays.filter((day) => day.fiberG >= fiberTargetG).length;
}

export function dayOfWeekBreakdown(meals: MealEntry[]): Record<Weekday, number> {
  const totals = emptyWeekdayBreakdown();
  for (const meal of meals) {
    const weekday = toWeekday(meal.timestamp);
    if (weekday === null) {
      continue;
    }
    totals[weekday] += meal.totalCalories;
  }
  return totals;
}

export function timeOfDayBreakdown(meals: MealEntry[]): Record<TimeOfDayBucket, number> {
  const totals = emptyTimeOfDayBreakdown();
  for (const meal of meals) {
    const hour = meal.timestamp.getHours();
    const bucket = timeOfDayBucketForHour(hour);
    totals[bucket] += meal.totalCalories;
  }
  return totals;
}

export function weekendWeekdayAverages(
  loggedDays: DailyNutritionSummary[],
): { weekend: number; weekday: number } | null {
  const weekendDays: DailyNutritionSummary[] = [];
  const weekdayDays: DailyNutritionSummary[] = [];

  for (const day of loggedDays) {
    const weekday = toWeekday(day.date);
    if (weekday === null) {
      continue;
    }
    if (isWeekendWeekday(weekday)) {
      weekendDays.push(day);
    } else {
      weekdayDays.push(day);
    }
  }

  if (weekendDays.length === 0 || weekdayDays.length === 0) {
    return null;
  }

  const weekendAvg =
    weekendDays.reduce((sum, day) => sum + day.calories, 0) / weekendDays.length;
  const weekdayAvg =
    weekdayDays.reduce((sum, day) => sum + day.calories, 0) / weekdayDays.length;
  return { weekend: weekendAvg, weekday: weekdayAvg };
}

export function topFoods(meals: MealEntry[], limit: number): TopFoodEntry[] {
  if (limit <= 0) {
    return [];
  }

  interface Accumulator {
    displayName: string;
    count: number;
    totalCalories: number;
  }

  const grouped = new Map<string, Accumulator>();

  for (const meal of meals) {
    for (const item of meal.items) {
      const trimmed = item.name.trim();
      if (!trimmed) {
        continue;
      }
      const key = trimmed.toLowerCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalCalories += item.calories;
      } else {
        grouped.set(key, {
          displayName: trimmed,
          count: 1,
          totalCalories: item.calories,
        });
      }
    }
  }

  return [...grouped.values()]
    .sort((lhs, rhs) => {
      if (lhs.count !== rhs.count) {
        return rhs.count - lhs.count;
      }
      return lhs.displayName.localeCompare(rhs.displayName);
    })
    .slice(0, limit)
    .map((entry) => ({
      name: entry.displayName,
      count: entry.count,
      avgCalories: Math.trunc(entry.totalCalories / entry.count),
    }));
}
