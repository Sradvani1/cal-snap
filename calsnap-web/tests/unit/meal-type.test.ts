import { describe, expect, it } from 'vitest';
import { suggestedMealTypeForDate } from '@/lib/models/meal-type';

function dateWithHour(hour: number): Date {
  return new Date(2026, 5, 14, hour, 0, 0, 0);
}

describe('MealType', () => {
  it('suggested breakfast', () => {
    expect(suggestedMealTypeForDate(dateWithHour(10))).toBe('breakfast');
  });

  it('suggested lunch', () => {
    expect(suggestedMealTypeForDate(dateWithHour(11))).toBe('lunch');
  });

  it('suggested snack', () => {
    expect(suggestedMealTypeForDate(dateWithHour(17))).toBe('snack');
  });

  it('suggested dinner', () => {
    expect(suggestedMealTypeForDate(dateWithHour(18))).toBe('dinner');
  });
});
