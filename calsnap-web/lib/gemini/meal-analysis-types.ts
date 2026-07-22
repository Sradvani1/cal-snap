export interface MealAnalysisFoodItemResult {
  name: string;
  estimatedWeightG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  fiberG: number;
  confidence: number;
}

export interface MealAnalysisMealTotal {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  fiberG: number;
}

export interface MealAnalysisResponse {
  items: MealAnalysisFoodItemResult[];
  mealTotal: MealAnalysisMealTotal;
  flaggedItems: string[];
  estimationNotes: string;
}
