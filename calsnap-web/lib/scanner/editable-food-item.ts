import { AppConstants } from '@/lib/constants';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealAnalysisFoodItemResult } from '@/lib/gemini/meal-analysis-types';

export interface EditableFoodItem {
  id: string;
  name: string;
  weightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: number;
  isFlagged: boolean;
  originalWeightG: number;
}

export function updateEditableItemWeight(
  item: EditableFoodItem,
  newWeightG: number,
): EditableFoodItem {
  if (item.weightG <= 0) {
    return item;
  }
  const ratio = newWeightG / item.weightG;
  return {
    ...item,
    weightG: newWeightG,
    calories: Math.round(item.calories * ratio),
    proteinG: item.proteinG * ratio,
    carbsG: item.carbsG * ratio,
    fatG: item.fatG * ratio,
    fiberG: item.fiberG * ratio,
  };
}

export function editableFoodItemFromFoodItem(foodItem: FoodItem): EditableFoodItem {
  return {
    id: foodItem.id,
    name: foodItem.name,
    weightG: foodItem.estimatedWeightG,
    calories: foodItem.calories,
    proteinG: foodItem.proteinG,
    carbsG: foodItem.carbsG,
    fatG: foodItem.fatG,
    fiberG: foodItem.fiberG,
    confidence: foodItem.confidence,
    isFlagged: foodItem.isFlagged,
    originalWeightG: foodItem.estimatedWeightG,
  };
}

export function editableFoodItemFromAnalysisResult(
  result: MealAnalysisFoodItemResult,
  flaggedNames: Set<string>,
): EditableFoodItem {
  const isFlagged =
    result.confidence < AppConstants.Gemini.confidenceThreshold ||
    flaggedNames.has(result.name);
  return {
    id: crypto.randomUUID(),
    name: result.name,
    weightG: result.estimatedWeightG,
    calories: result.calories,
    proteinG: result.proteinG,
    carbsG: result.carbsG,
    fatG: result.fatG,
    fiberG: result.fiberG,
    confidence: result.confidence,
    isFlagged,
    originalWeightG: result.estimatedWeightG,
  };
}

export function editableFoodItemToFoodItem(item: EditableFoodItem): FoodItem {
  return {
    id: item.id,
    name: item.name,
    estimatedWeightG: item.weightG,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    usdaFoodId: undefined,
    isFlagged: item.isFlagged,
  };
}
