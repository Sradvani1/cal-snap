import { isCalorieIntakeOnTarget } from '@/lib/dashboard/calorie-progress';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { AppConstants } from '@/lib/constants';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MacroSplit } from '@/lib/models/macro-split';
import { addMealTotals, emptyMealTotals } from '@/lib/models/meal-totals';
import { macroPercents } from '@/lib/nutrition/calculator';
import type { DailyNutritionSummary, TopFoodEntry } from '@/lib/analytics/analytics-types';

const DAY_MAX = AppConstants.Nutrition.plausibleDayMax;

function sanitizeDayTotal(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(value, max));
}

export function loggedDailySummaries(meals: MealEntry[]): DailyNutritionSummary[] {
  const byDay = new Map<number, { date: Date; totals: ReturnType<typeof emptyMealTotals> }>();

  for (const meal of meals) {
    const day = startOfLocalDay(meal.timestamp);
    const key = day.getTime();
    const existing = byDay.get(key) ?? { date: day, totals: emptyMealTotals() };
    addMealTotals(existing.totals, meal);
    byDay.set(key, existing);
  }

  return [...byDay.values()]
    .map(({ date, totals }) => ({
      date,
      calories: sanitizeDayTotal(totals.totalCalories, DAY_MAX.calories),
      proteinG: sanitizeDayTotal(totals.totalProteinG, DAY_MAX.proteinG),
      carbsG: sanitizeDayTotal(totals.totalCarbsG, DAY_MAX.carbsG),
      fatG: sanitizeDayTotal(totals.totalFatG, DAY_MAX.fatG),
      saturatedFatG: sanitizeDayTotal(totals.totalSaturatedFatG, DAY_MAX.saturatedFatG),
      unsaturatedFatG: sanitizeDayTotal(totals.totalUnsaturatedFatG, DAY_MAX.unsaturatedFatG),
      fiberG: sanitizeDayTotal(totals.totalFiberG, DAY_MAX.fiberG),
      logged: true,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
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
        logged: false,
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
