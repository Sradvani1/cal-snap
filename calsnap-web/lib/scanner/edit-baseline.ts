import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import type { MealType } from '@/lib/models/meal-type';

export interface EditBaseline {
  mealType: MealType;
  textDescription: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  items: EditableFoodItem[];
}

export function editBaselineFromState(
  mealType: MealType,
  textDescription: string,
  totals: {
    totalCalories: number;
    totalProteinG: number;
    totalCarbsG: number;
    totalFatG: number;
    totalFiberG: number;
  },
  items: EditableFoodItem[],
): EditBaseline {
  return {
    mealType,
    textDescription: textDescription.trim(),
    ...totals,
    items: items.map(snapshotEditableItem),
  };
}

function snapshotEditableItem(item: EditableFoodItem): EditableFoodItem {
  return {
    id: item.id,
    name: item.name,
    weightG: item.weightG,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    isFlagged: item.isFlagged,
    originalWeightG: item.originalWeightG,
  };
}

export function editBaselinesEqual(a: EditBaseline, b: EditBaseline): boolean {
  if (
    a.mealType !== b.mealType ||
    a.textDescription !== b.textDescription ||
    a.totalCalories !== b.totalCalories ||
    a.totalProteinG !== b.totalProteinG ||
    a.totalCarbsG !== b.totalCarbsG ||
    a.totalFatG !== b.totalFatG ||
    a.totalFiberG !== b.totalFiberG ||
    a.items.length !== b.items.length
  ) {
    return false;
  }

  return a.items.every((item, index) => {
    const other = b.items[index];
    return (
      item.id === other.id &&
      item.name === other.name &&
      item.weightG === other.weightG &&
      item.calories === other.calories &&
      item.proteinG === other.proteinG &&
      item.carbsG === other.carbsG &&
      item.fatG === other.fatG &&
      item.fiberG === other.fiberG &&
      item.confidence === other.confidence &&
      item.isFlagged === other.isFlagged
    );
  });
}

export class MealScannerNotInEditModeError extends Error {
  constructor() {
    super('Not in edit mode');
    this.name = 'MealScannerNotInEditModeError';
  }
}

export function assertScannerEditMode(isEditing: boolean): void {
  if (!isEditing) {
    throw new MealScannerNotInEditModeError();
  }
}
