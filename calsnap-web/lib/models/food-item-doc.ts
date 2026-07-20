import type { FoodItem } from './food-item';
import type { FoodItemDoc } from './meal-entry-doc';

export function foodItemDocToEntry(doc: FoodItemDoc): FoodItem {
  return {
    id: doc.id,
    name: doc.name,
    estimatedWeightG: doc.estimatedWeightG,
    calories: doc.calories,
    proteinG: doc.proteinG,
    carbsG: doc.carbsG,
    fatG: doc.fatG,
    fiberG: doc.fiberG,
    confidence: doc.confidence,
    usdaFoodId: doc.usdaFoodId,
    isFlagged: doc.isFlagged,
  };
}

export function foodItemToDoc(item: FoodItem): FoodItemDoc {
  return {
    id: item.id,
    name: item.name,
    estimatedWeightG: item.estimatedWeightG,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    isFlagged: item.isFlagged,
    ...(item.usdaFoodId !== undefined ? { usdaFoodId: item.usdaFoodId } : {}),
  };
}
