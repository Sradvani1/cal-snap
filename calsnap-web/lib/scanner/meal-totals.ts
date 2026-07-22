import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';

export interface MealTotals {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalSaturatedFatG: number;
  totalUnsaturatedFatG: number;
  totalFiberG: number;
}

export function sumEditableItems(items: EditableFoodItem[]): MealTotals {
  return items.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinG: acc.totalProteinG + item.proteinG,
      totalCarbsG: acc.totalCarbsG + item.carbsG,
      totalFatG: acc.totalFatG + item.fatG,
      totalSaturatedFatG: acc.totalSaturatedFatG + item.saturatedFatG,
      totalUnsaturatedFatG: acc.totalUnsaturatedFatG + item.unsaturatedFatG,
      totalFiberG: acc.totalFiberG + item.fiberG,
    }),
    {
      totalCalories: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      totalSaturatedFatG: 0,
      totalUnsaturatedFatG: 0,
      totalFiberG: 0,
    },
  );
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
