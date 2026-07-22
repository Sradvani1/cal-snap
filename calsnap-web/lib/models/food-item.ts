/** Per-item nutrition estimate from meal analysis. Weights in grams. */
export interface FoodItem {
  id: string;
  name: string;
  /** Estimated portion weight in grams. */
  estimatedWeightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  fiberG: number;
  confidence: number;
  usdaFoodId?: string;
  isFlagged: boolean;
}
