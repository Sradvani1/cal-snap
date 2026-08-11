import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import { addMealTotals, emptyMealTotals, type MealTotals } from '@/lib/models/meal-totals';

export type { MealTotals } from '@/lib/models/meal-totals';

export function sumEditableItems(items: EditableFoodItem[]): MealTotals {
  const totals = emptyMealTotals();
  for (const item of items) {
    addMealTotals(totals, {
      totalCalories: item.calories,
      totalProteinG: item.proteinG,
      totalCarbsG: item.carbsG,
      totalFatG: item.fatG,
      totalSaturatedFatG: item.saturatedFatG,
      totalUnsaturatedFatG: item.unsaturatedFatG,
      totalFiberG: item.fiberG,
    });
  }
  return totals;
}

export function overallConfidence(items: EditableFoodItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const sum = items.reduce((acc, item) => acc + item.confidence, 0);
  return sum / items.length;
}

export function allItemsFlagged(items: EditableFoodItem[]): boolean {
  return items.length > 0 && items.every((item) => item.isFlagged);
}

export function hasAdjustedItems(
  items: EditableFoodItem[],
  originalWeights: Map<string, number>,
): boolean {
  return items.some((item) => {
    const original = originalWeights.get(item.id);
    if (original === undefined) {
      return false;
    }
    return Math.abs(item.weightG - original) > 0.01;
  });
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 0.8) {
    return 'high';
  }
  if (score >= 0.6) {
    return 'medium';
  }
  return 'low';
}
