import { describe, expect, it } from 'vitest';
import {
  adherencePercent,
  chartDailySeries,
  dayOfWeekBreakdown,
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

  it('dayOfWeekBreakdown groups meals by weekday', () => {
    const monday = new Date(2026, 5, 8, 12, 0, 0);
    const wednesday = new Date(2026, 5, 10, 12, 0, 0);

    const meals = [
      makeMeal({ timestamp: monday, totalCalories: 500 }),
      makeMeal({ id: 'meal-2', timestamp: new Date(2026, 5, 8, 13, 0, 0), totalCalories: 600 }),
      makeMeal({ id: 'meal-3', timestamp: wednesday, totalCalories: 800 }),
    ];

    const breakdown = dayOfWeekBreakdown(meals);
    expect(breakdown[2]).toBe(1100);
    expect(breakdown[4]).toBe(800);
    expect(breakdown[3]).toBe(0);
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
