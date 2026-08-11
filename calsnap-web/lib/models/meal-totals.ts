export interface MealTotals {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalSaturatedFatG: number;
  totalUnsaturatedFatG: number;
  totalFiberG: number;
}

export function emptyMealTotals(): MealTotals {
  return {
    totalCalories: 0,
    totalProteinG: 0,
    totalCarbsG: 0,
    totalFatG: 0,
    totalSaturatedFatG: 0,
    totalUnsaturatedFatG: 0,
    totalFiberG: 0,
  };
}

export function addMealTotals(target: MealTotals, source: MealTotals): void {
  target.totalCalories += source.totalCalories;
  target.totalProteinG += source.totalProteinG;
  target.totalCarbsG += source.totalCarbsG;
  target.totalFatG += source.totalFatG;
  target.totalSaturatedFatG += source.totalSaturatedFatG;
  target.totalUnsaturatedFatG += source.totalUnsaturatedFatG;
  target.totalFiberG += source.totalFiberG;
}
