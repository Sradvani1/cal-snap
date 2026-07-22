import { describe, expect, it } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { WeighIn } from '@/lib/models/weigh-in';
import { makeCSV } from '@/lib/services/data-export';

describe('data-export', () => {
  it('produces CSV with correct headers and rows', () => {
    const timestamp = new Date(1_700_000_000_000);
    const meal: MealEntry = {
      id: 'meal-abc',
      userId: 'user-xyz',
      timestamp,
      mealType: 'lunch',
      textDescription: 'Chicken, rice',
      totalCalories: 500,
      totalProteinG: 40,
      totalCarbsG: 50,
      totalFatG: 12,
      totalSaturatedFatG: 3,
      totalUnsaturatedFatG: 9,
      totalFiberG: 5,
      geminiConfidence: 0.9,
      isManuallyAdjusted: false,
      items: [],
    };

    const weighIn: WeighIn = {
      id: 'weighin-def',
      userId: 'user-xyz',
      date: timestamp,
      weightKg: 78.5,
      calculatedTDEE: 2400,
      adjustedDailyTarget: 2050,
      bmi: 24.5,
      source: 'manual',
    };

    const csv = makeCSV([meal], [weighIn]);

    expect(csv).toContain('# meals');
    expect(csv).toContain('# weigh_ins');
    expect(csv).toContain('id,userId,timestamp,mealType,calories');
    expect(csv).toContain('id,userId,date,weightKg,tdee,target,bmi,source');
    expect(csv).toContain('meal-abc');
    expect(csv).toContain('weighin-def');
    expect(csv).toContain('500');
    expect(csv).toContain('78.5');
    expect(csv).not.toContain('photoStoragePath');
    expect(csv).not.toContain('photoData');
  });
});
