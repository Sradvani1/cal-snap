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
  saturatedFatG: number;
  unsaturatedFatG: number;
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
    saturatedFatG: item.saturatedFatG * ratio,
    unsaturatedFatG: item.unsaturatedFatG * ratio,
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
    saturatedFatG: foodItem.saturatedFatG,
    unsaturatedFatG: foodItem.unsaturatedFatG,
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
    saturatedFatG: result.saturatedFatG,
    unsaturatedFatG: result.unsaturatedFatG,
    fiberG: result.fiberG,
    confidence: result.confidence,
    isFlagged,
    originalWeightG: result.estimatedWeightG,
  };
}

export function itemWeightRange(originalWeightG: number): { min: number; max: number } {
  const min = Math.max(1, Math.round(originalWeightG * 0.5));
  const max = Math.max(min + 1, Math.round(originalWeightG * 1.5));
  return { min, max };
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
    saturatedFatG: item.saturatedFatG,
    unsaturatedFatG: item.unsaturatedFatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    usdaFoodId: undefined,
    isFlagged: item.isFlagged,
  };
}
