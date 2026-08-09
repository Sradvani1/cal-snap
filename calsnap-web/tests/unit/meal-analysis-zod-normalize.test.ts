import { describe, expect, it } from 'vitest';
import mealAnalysisFixture from './fixtures/meal-analysis.json';
import {
  normalizeMealAnalysisRaw,
  parseMealAnalysisResponse,
  safeParseMealAnalysisResponse,
} from '@/lib/gemini/meal-analysis-zod';

describe('meal-analysis-zod normalization', () => {
  it('accepts camelCase Gemini-style payload', () => {
    const parsed = parseMealAnalysisResponse(mealAnalysisFixture);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0]?.name).toBe('Grilled chicken');
    expect(parsed.mealTotal.calories).toBe(366);
    expect(parsed.flaggedItems).toEqual([]);
    expect(parsed.estimationNotes).toBe('E2E mock analysis');
  });

  it('defaults missing numeric fields to zero', () => {
    const parsed = parseMealAnalysisResponse({
      items: [
        {
          name: 'apple',
          calories: 95,
          confidence: 0.8,
        },
      ],
      meal_total: { calories: 95 },
      flagged_items: [],
    });
    expect(parsed.items[0]?.fiberG).toBe(0);
    expect(parsed.items[0]?.saturatedFatG).toBe(0);
    expect(parsed.items[0]?.unsaturatedFatG).toBe(0);
    expect(parsed.mealTotal.fiberG).toBe(0);
    expect(parsed.mealTotal.saturatedFatG).toBe(0);
    expect(parsed.mealTotal.unsaturatedFatG).toBe(0);
  });

  it('coerces flagged item objects to names', () => {
    const normalized = normalizeMealAnalysisRaw({
      items: [],
      meal_total: { calories: 0, protein_g: 0, carbs_g: 0, saturated_fat_g: 0, unsaturated_fat_g: 0, fiber_g: 0 },
      flagged_items: [{ name: 'hidden sauce' }],
      estimation_notes: 'notes',
    });
    expect(normalized).toMatchObject({
      flagged_items: ['hidden sauce'],
    });
  });

  it('safeParse success path matches single-pass totals', () => {
    const result = safeParseMealAnalysisResponse(mealAnalysisFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mealTotal.calories).toBe(366);
      expect(result.data.items[1]).toMatchObject({
        name: 'Brown rice',
        carbsG: 28,
        calories: 137,
      });
    }
  });

  it('reports validation errors for non-object payloads', () => {
    const result = safeParseMealAnalysisResponse('not-json');
    expect(result.success).toBe(false);
  });

  it('clamps negative nutrition values and confidence to valid bounds', () => {
    const parsed = parseMealAnalysisResponse({
      items: [
        {
          name: 'unexpected model output',
          estimated_weight_g: -10,
          protein_g: -20,
          carbs_g: -30,
          fiber_g: -4,
          saturated_fat_g: -5,
          unsaturated_fat_g: -6,
          confidence: 2,
        },
      ],
    });

    expect(parsed.items[0]).toMatchObject({
      estimatedWeightG: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      saturatedFatG: 0,
      unsaturatedFatG: 0,
      fiberG: 0,
      confidence: 1,
      calories: 0,
    });
  });

  it('clamps confidence below zero to zero', () => {
    const parsed = parseMealAnalysisResponse({
      items: [{ name: 'confidence test', confidence: -1 }],
    });

    expect(parsed.items[0]?.confidence).toBe(0);
  });
});
