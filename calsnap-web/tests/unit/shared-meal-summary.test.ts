import { describe, expect, it } from 'vitest';
import { sharedMealSummary } from '@/lib/shares/shared-meal-summary';

describe('sharedMealSummary', () => {
  it('builds a title from meal type and calories', () => {
    const summary = sharedMealSummary({
      mealType: 'dinner',
      totalCalories: 849.6,
      items: [{ name: 'Grilled Salmon' }],
    });

    expect(summary.title).toBe('Dinner · 850 kcal');
    expect(summary.description).toBe('Grilled Salmon');
  });

  it('lists up to four item names and summarizes the rest', () => {
    const summary = sharedMealSummary({
      mealType: 'lunch',
      totalCalories: 900,
      items: ['Salmon', 'Rice', 'Salad', 'Bread', 'Soup', 'Tea'].map((name) => ({ name })),
    });

    expect(summary.description).toBe('Salmon, Rice, Salad, Bread +2 more');
  });

  it('caps the description length', () => {
    const summary = sharedMealSummary({
      mealType: 'dinner',
      totalCalories: 900,
      items: [{ name: 'A'.repeat(100) }, { name: 'B'.repeat(100) }],
    });

    expect(summary.description.length).toBeLessThanOrEqual(160);
    expect(summary.description.endsWith('…')).toBe(true);
  });

  it('handles a meal with no items', () => {
    expect(sharedMealSummary({ mealType: 'snack', totalCalories: 0, items: [] }).description).toBe('');
  });
});
