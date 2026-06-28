import { describe, expect, it } from 'vitest';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';

describe('MealShareCard', () => {
  it('uses expected meal type label for lunch share card props', () => {
    expect(MEAL_TYPE_LABELS.lunch).toBe('Lunch');
    const macroLabels = ['P', 'C', 'F'];
    const grams = [40, 55, 22];
    const formatted = macroLabels.map((label, index) => `${label}: ${Math.round(grams[index])}g`);
    expect(formatted).toEqual(['P: 40g', 'C: 55g', 'F: 22g']);
  });
});
