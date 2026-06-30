import mealAnalysis from './fixtures/meal-analysis.json';

export function firstItemName(): string {
  return mealAnalysis.items[0]?.name ?? '';
}

export function totalCalories(): number {
  return mealAnalysis.mealTotal.calories;
}
