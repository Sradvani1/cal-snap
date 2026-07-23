import { z } from 'zod';
import type { MealAnalysisResponse } from '@/lib/gemini/meal-analysis-types';

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function readField(
  record: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
): unknown {
  if (record[snakeKey] !== undefined) {
    return record[snakeKey];
  }
  return record[camelKey];
}

function normalizeFoodItem(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const name = asString(readField(item, 'name', 'name'));
  if (!name) {
    return null;
  }

  const carbs_g = asNumber(readField(item, 'carbs_g', 'carbsG'));
  const protein_g = asNumber(readField(item, 'protein_g', 'proteinG'));
  const fat_g = asNumber(readField(item, 'fat_g', 'fatG'));
  const fiber_g = asNumber(readField(item, 'fiber_g', 'fiberG'));

  return {
    name,
    estimated_weight_g: asNumber(readField(item, 'estimated_weight_g', 'estimatedWeightG')),
    calories: Math.round((carbs_g * 4) + (protein_g * 4) + (fat_g * 9) + (fiber_g * 2)),
    protein_g,
    carbs_g,
    fat_g,
    saturated_fat_g: asNumber(readField(item, 'saturated_fat_g', 'saturatedFatG')),
    unsaturated_fat_g: asNumber(readField(item, 'unsaturated_fat_g', 'unsaturatedFatG')),
    fiber_g,
    confidence: asNumber(readField(item, 'confidence', 'confidence')),
  };
}

function normalizeMealTotal(raw: unknown): Record<string, number> {
  const total =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  return {
    protein_g: asNumber(readField(total, 'protein_g', 'proteinG')),
    carbs_g: asNumber(readField(total, 'carbs_g', 'carbsG')),
    fat_g: asNumber(readField(total, 'fat_g', 'fatG')),
    saturated_fat_g: asNumber(readField(total, 'saturated_fat_g', 'saturatedFatG')),
    unsaturated_fat_g: asNumber(readField(total, 'unsaturated_fat_g', 'unsaturatedFatG')),
    fiber_g: asNumber(readField(total, 'fiber_g', 'fiberG')),
  };
}

function normalizeFlaggedItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (typeof entry === 'object' && entry !== null) {
        const object = entry as Record<string, unknown>;
        if (typeof object.name === 'string') {
          return object.name;
        }
      }
      return asString(entry);
    })
    .filter((entry) => entry.length > 0);
}

/** Normalize Gemini JSON (snake_case or camelCase) before Zod validation. */
export function normalizeMealAnalysisRaw(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) {
    return raw;
  }

  const record = raw as Record<string, unknown>;
  const itemsRaw = readField(record, 'items', 'items');
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((item) => normalizeFoodItem(item))
        .filter((item): item is Record<string, unknown> => item !== null)
    : [];

  const mealTotalRaw = readField(record, 'meal_total', 'mealTotal');

  return {
    items,
    meal_total: {
      ...normalizeMealTotal(mealTotalRaw),
      calories: items.reduce((sum, item) => sum + (item.calories as number), 0),
    },
    flagged_items: normalizeFlaggedItems(
      readField(record, 'flagged_items', 'flaggedItems'),
    ),
    estimation_notes: asString(
      readField(record, 'estimation_notes', 'estimationNotes'),
    ),
  };
}

const foodItemSchema = z.object({
  name: z.string(),
  estimated_weight_g: z.number(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  saturated_fat_g: z.number(),
  unsaturated_fat_g: z.number(),
  fiber_g: z.number(),
  confidence: z.number(),
});

const mealTotalSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  saturated_fat_g: z.number(),
  unsaturated_fat_g: z.number(),
  fiber_g: z.number(),
});

const mealAnalysisRawSchema = z.object({
  items: z.array(foodItemSchema),
  meal_total: mealTotalSchema,
  flagged_items: z.array(z.string()),
  estimation_notes: z.string(),
});

export function parseMealAnalysisResponse(raw: unknown): MealAnalysisResponse {
  const parsed = mealAnalysisRawSchema.parse(normalizeMealAnalysisRaw(raw));
  return {
    items: parsed.items.map((item) => ({
      name: item.name,
      estimatedWeightG: item.estimated_weight_g,
      calories: item.calories,
      proteinG: item.protein_g,
      carbsG: item.carbs_g,
      fatG: item.fat_g,
      saturatedFatG: item.saturated_fat_g,
      unsaturatedFatG: item.unsaturated_fat_g,
      fiberG: item.fiber_g,
      confidence: item.confidence,
    })),
    mealTotal: {
      calories: parsed.meal_total.calories,
      proteinG: parsed.meal_total.protein_g,
      carbsG: parsed.meal_total.carbs_g,
      fatG: parsed.meal_total.fat_g,
      saturatedFatG: parsed.meal_total.saturated_fat_g,
      unsaturatedFatG: parsed.meal_total.unsaturated_fat_g,
      fiberG: parsed.meal_total.fiber_g,
    },
    flaggedItems: parsed.flagged_items,
    estimationNotes: parsed.estimation_notes,
  };
}

export function safeParseMealAnalysisResponse(
  raw: unknown,
): { success: true; data: MealAnalysisResponse } | { success: false; error: z.ZodError } {
  const result = mealAnalysisRawSchema.safeParse(normalizeMealAnalysisRaw(raw));
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: parseMealAnalysisResponse(result.data) };
}
