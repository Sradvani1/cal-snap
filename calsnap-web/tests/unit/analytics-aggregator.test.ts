import { describe, expect, it } from 'vitest';
import {
  adherencePercent,
  chartDailySeries,
  loggedDailySummaries,
  topFoods,
} from '@/lib/analytics/analytics-aggregator';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import { isCalorieIntakeOnTarget } from '@/lib/dashboard/calorie-progress';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealEntry } from '@/lib/models/meal-entry';

function makeMeal(
  overrides: Partial<MealEntry> & Pick<MealEntry, 'timestamp' | 'totalCalories'>,
): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp,
    mealType: overrides.mealType ?? 'lunch',
    totalCalories: overrides.totalCalories,
    totalProteinG: overrides.totalProteinG ?? 0,
    totalCarbsG: overrides.totalCarbsG ?? 0,
    totalFatG: overrides.totalFatG ?? 0,
    totalSaturatedFatG: overrides.totalSaturatedFatG ?? 0,
    totalUnsaturatedFatG: overrides.totalUnsaturatedFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 0,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
  };
}

function makeFood(name: string, calories: number): FoodItem {
  return {
    id: `${name}-id`,
    name,
    estimatedWeightG: 100,
    calories,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    saturatedFatG: 0,
    unsaturatedFatG: 0,
    fiberG: 0,
    confidence: 0.9,
    isFlagged: false,
  };
}

describe('analytics aggregator', () => {
  it('adherencePercent matches iOS AnalyticsTests', () => {
    const loggedDays: DailyNutritionSummary[] = [
      { date: new Date(), calories: 1750, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 1900, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 2100, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 2200, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 2000, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 1700, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
      { date: new Date(), calories: 2050, proteinG: 0, carbsG: 0, fatG: 0, saturatedFatG: 0, unsaturatedFatG: 0, fiberG: 0 },
    ];

    const result = adherencePercent(loggedDays, 2000);
    expect(result).toBeCloseTo((4 / 7) * 100, 1);

    const partialResult = adherencePercent(loggedDays.slice(0, 5), 2000);
    expect(partialResult).toBeCloseTo((3 / 5) * 100, 1);
  });

  it('topFoods sorts by frequency then name', () => {
    const meals = [
      makeMeal({
        timestamp: new Date(),
        totalCalories: 800,
        items: [
          makeFood('Chicken', 200),
          makeFood('Chicken', 200),
          makeFood('Chicken', 200),
          makeFood('Chicken', 200),
        ],
      }),
      makeMeal({
        id: 'meal-2',
        timestamp: new Date(),
        totalCalories: 300,
        items: [makeFood('Rice', 150), makeFood('Rice', 150)],
      }),
      makeMeal({
        id: 'meal-3',
        timestamp: new Date(),
        totalCalories: 530,
        items: [
          makeFood('Broccoli', 50),
          makeFood('Salmon', 220),
          makeFood('Eggs', 140),
          makeFood('Yogurt', 120),
        ],
      }),
    ];

    const result = topFoods(meals, 5);
    expect(result).toHaveLength(5);
    expect(result[0]?.name).toBe('Chicken');
    expect(result[0]?.count).toBe(4);
    expect(result[0]?.avgCalories).toBe(200);
    expect(result[0]!.count).toBeGreaterThanOrEqual(result[1]!.count);
  });

  it('chartDailySeries zero-fills gaps in window', () => {
    const start = startOfLocalDay(new Date(2026, 5, 8));
    const end = startOfLocalDay(new Date(2026, 5, 10));
    const loggedDays: DailyNutritionSummary[] = [
      {
        date: startOfLocalDay(new Date(2026, 5, 9)),
        calories: 1800,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        saturatedFatG: 0,
        unsaturatedFatG: 0,
        fiberG: 0,
      },
    ];

    const series = chartDailySeries(loggedDays, start, end);
    expect(series).toHaveLength(3);
    expect(series.filter((day) => day.calories === 0)).toHaveLength(2);
  });

  it('chartDailySeries marks zero-fill days as unlogged', () => {
    const start = startOfLocalDay(new Date(2026, 5, 8));
    const end = startOfLocalDay(new Date(2026, 5, 9));
    const loggedDays: DailyNutritionSummary[] = [
      {
        date: startOfLocalDay(new Date(2026, 5, 9)),
        calories: 1800,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        saturatedFatG: 0,
        unsaturatedFatG: 0,
        fiberG: 0,
        logged: true,
      },
    ];

    const series = chartDailySeries(loggedDays, start, end);
    expect(series.map((day) => day.logged)).toEqual([false, true]);
  });

  it('loggedDailySummaries clamps implausible day totals to the day caps', () => {
    const meals = [
      makeMeal({
        timestamp: new Date(2026, 5, 8, 12),
        totalCalories: 58365,
        totalProteinG: 58365,
        totalCarbsG: 58365,
        totalFatG: 58365,
        totalFiberG: 58365,
      }),
    ];

    const summaries = loggedDailySummaries(meals);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      calories: 9000,
      proteinG: 600,
      carbsG: 900,
      fatG: 500,
      fiberG: 250,
      logged: true,
    });
  });

  it('loggedDailySummaries floors negative totals at zero', () => {
    const meals = [
      makeMeal({
        timestamp: new Date(2026, 5, 8, 12),
        totalCalories: -200,
        totalFiberG: -5,
      }),
    ];

    const summaries = loggedDailySummaries(meals);
    expect(summaries[0]).toMatchObject({
      calories: 0,
      fiberG: 0,
    });
  });

  it('loggedDailySummaries coerces non-finite totals to zero', () => {
    const meals = [
      makeMeal({
        timestamp: new Date(2026, 5, 8, 12),
        totalCalories: Number.NaN,
        totalFiberG: Number.POSITIVE_INFINITY,
      }),
    ];

    const summaries = loggedDailySummaries(meals);
    expect(summaries[0]).toMatchObject({
      calories: 0,
      fiberG: 0,
    });
  });

  it('isCalorieIntakeOnTarget uses ±10% band', () => {
    expect(isCalorieIntakeOnTarget(1800, 2000)).toBe(true);
    expect(isCalorieIntakeOnTarget(2000, 2000)).toBe(true);
    expect(isCalorieIntakeOnTarget(2199, 2000)).toBe(true);
    expect(isCalorieIntakeOnTarget(2200, 2000)).toBe(false);
    expect(isCalorieIntakeOnTarget(1700, 2000)).toBe(false);
    expect(isCalorieIntakeOnTarget(2300, 2000)).toBe(false);
    expect(isCalorieIntakeOnTarget(2000, 0)).toBe(false);
  });
});
