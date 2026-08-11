import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';
import { addMealTotals, emptyMealTotals } from '@/lib/models/meal-totals';

export type MealsByType = Partial<Record<MealType, MealEntry[]>>;

export interface AggregatedMeals {
  todaysCalories: number;
  todaysProteinG: number;
  todaysCarbsG: number;
  todaysFatG: number;
  todaysSaturatedFatG: number;
  todaysUnsaturatedFatG: number;
  todaysFiberG: number;
  mealsByType: MealsByType;
}

export function aggregateTodaysMeals(meals: MealEntry[]): AggregatedMeals {
  const totals = emptyMealTotals();

  const grouped: MealsByType = {};

  for (const meal of meals) {
    addMealTotals(totals, meal);

    const bucket = grouped[meal.mealType] ?? [];
    bucket.push(meal);
    grouped[meal.mealType] = bucket;
  }

  for (const mealType of Object.keys(grouped) as MealType[]) {
    grouped[mealType]?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  return {
    todaysCalories: totals.totalCalories,
    todaysProteinG: totals.totalProteinG,
    todaysCarbsG: totals.totalCarbsG,
    todaysFatG: totals.totalFatG,
    todaysSaturatedFatG: totals.totalSaturatedFatG,
    todaysUnsaturatedFatG: totals.totalUnsaturatedFatG,
    todaysFiberG: totals.totalFiberG,
    mealsByType: grouped,
  };
}
