import { describe, expect, it } from 'vitest';
import { filterFavoriteMeals } from '@/lib/favorites/filter-favorites';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';

function favorite(id: string, name: string, itemNames: string[]): FavoriteMeal {
  return {
    id,
    userId: 'user-1',
    originalMealId: `meal-${id}`,
    name,
    mealType: 'breakfast',
    totalCalories: 300,
    totalProteinG: 10,
    totalCarbsG: 40,
    totalFatG: 8,
    totalFiberG: 5,
    items: itemNames.map((itemName, i) => ({
      id: `item-${id}-${i}`,
      name: itemName,
      estimatedWeightG: 100,
      calories: 100,
      proteinG: 5,
      carbsG: 10,
      fatG: 2,
      saturatedFatG: 0,
      unsaturatedFatG: 2,
      fiberG: 1,
      confidence: 0.9,
      isFlagged: false,
    })),
    useCount: 0,
    lastUsedAt: null,
    createdAt: new Date('2026-07-01T10:00:00'),
    updatedAt: new Date('2026-07-01T10:00:00'),
  };
}

describe('filterFavoriteMeals', () => {
  const favorites = [
    favorite('oats', 'Overnight Oats', ['Rolled Oats', 'Milk']),
    favorite('chicken', 'Chicken Rice', ['Chicken Breast', 'Rice']),
    favorite('yogurt', 'Greek Yogurt', ['Greek Yogurt', 'Honey']),
  ];

  it('returns the full list for an empty query', () => {
    expect(filterFavoriteMeals(favorites, '')).toEqual(favorites);
    expect(filterFavoriteMeals(favorites, '   ')).toEqual(favorites);
  });

  it('matches favorite names case-insensitively', () => {
    expect(filterFavoriteMeals(favorites, 'oat').map((f) => f.id)).toEqual(['oats']);
    expect(filterFavoriteMeals(favorites, 'CHICKEN').map((f) => f.id)).toEqual(['chicken']);
  });

  it('matches food item names inside a favorite', () => {
    expect(filterFavoriteMeals(favorites, 'honey').map((f) => f.id)).toEqual(['yogurt']);
    expect(filterFavoriteMeals(favorites, 'rice').map((f) => f.id)).toEqual(['chicken']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterFavoriteMeals(favorites, 'pizza')).toEqual([]);
  });
});
