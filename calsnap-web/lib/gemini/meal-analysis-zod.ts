import { z } from 'zod';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';

const foodItemSchema = z.object({
  name: z.string(),
  estimated_weight_g: z.number(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
  confidence: z.number(),
});

const mealTotalSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
});

const mealAnalysisRawSchema = z.object({
  items: z.array(foodItemSchema),
  meal_total: mealTotalSchema,
  flagged_items: z.array(z.string()),
  estimation_notes: z.string(),
});

export function parseMealAnalysisResponse(raw: unknown): MealAnalysisResponse {
  const parsed = mealAnalysisRawSchema.parse(raw);
  return {
    items: parsed.items.map((item) => ({
      name: item.name,
      estimatedWeightG: item.estimated_weight_g,
      calories: Math.round(item.calories),
      proteinG: item.protein_g,
      carbsG: item.carbs_g,
      fatG: item.fat_g,
      fiberG: item.fiber_g,
      confidence: item.confidence,
    })),
    mealTotal: {
      calories: Math.round(parsed.meal_total.calories),
      proteinG: parsed.meal_total.protein_g,
      carbsG: parsed.meal_total.carbs_g,
      fatG: parsed.meal_total.fat_g,
      fiberG: parsed.meal_total.fiber_g,
    },
    flaggedItems: parsed.flagged_items,
    estimationNotes: parsed.estimation_notes,
  };
}

export function safeParseMealAnalysisResponse(
  raw: unknown,
): { success: true; data: MealAnalysisResponse } | { success: false; error: z.ZodError } {
  const result = mealAnalysisRawSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: parseMealAnalysisResponse(result.data) };
}
