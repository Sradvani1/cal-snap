import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';

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
  let todaysCalories = 0;
  let todaysProteinG = 0;
  let todaysCarbsG = 0;
  let todaysFatG = 0;
  let todaysSaturatedFatG = 0;
  let todaysUnsaturatedFatG = 0;
  let todaysFiberG = 0;

  const grouped: MealsByType = {};

  for (const meal of meals) {
    todaysCalories += meal.totalCalories;
    todaysProteinG += meal.totalProteinG;
    todaysCarbsG += meal.totalCarbsG;
    todaysFatG += meal.totalFatG;
    todaysSaturatedFatG += meal.totalSaturatedFatG;
    todaysUnsaturatedFatG += meal.totalUnsaturatedFatG;
    todaysFiberG += meal.totalFiberG;

    const bucket = grouped[meal.mealType] ?? [];
    bucket.push(meal);
    grouped[meal.mealType] = bucket;
  }

  for (const mealType of Object.keys(grouped) as MealType[]) {
    grouped[mealType]?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  return {
    todaysCalories,
    todaysProteinG,
    todaysCarbsG,
    todaysFatG,
    todaysSaturatedFatG,
    todaysUnsaturatedFatG,
    todaysFiberG,
    mealsByType: grouped,
  };
}
