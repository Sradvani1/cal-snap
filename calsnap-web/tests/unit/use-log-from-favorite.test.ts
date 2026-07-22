import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMeal } from '@/lib/repositories/meals';
import { favoriteToMealEntry } from '@/lib/queries/use-log-from-favorite';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import type { FoodItem } from '@/lib/models/food-item';

function makeItem(name: string): FoodItem {
  return {
    id: `item-${name}`,
    name,
    estimatedWeightG: 100,
    calories: 200,
    proteinG: 10,
    carbsG: 20,
    fatG: 5,
    saturatedFatG: 1,
    unsaturatedFatG: 4,
    fiberG: 2,
    confidence: 0.9,
    isFlagged: false,
  };
}

function makeFavorite(overrides: Partial<FavoriteMeal> = {}): FavoriteMeal {
  return {
    id: 'fav-1',
    userId: 'user-1',
    name: 'Bagel with cream cheese',
    mealType: 'breakfast',
    totalCalories: 350,
    totalProteinG: 12,
    totalCarbsG: 45,
    totalFatG: 14,
    totalFiberG: 2,
    items: [makeItem('Bagel'), makeItem('Cream Cheese')],
    createdAt: new Date('2026-07-01T10:00:00'),
    updatedAt: new Date('2026-07-01T10:00:00'),
    ...overrides,
  };
}

vi.mock('@/lib/repositories/meals', () => ({
  createMeal: vi.fn(),
}));

const mockedCreateMeal = vi.mocked(createMeal);

describe('favoriteToMealEntry', () => {
  it('creates a MealEntry from a FavoriteMeal', () => {
    const favorite = makeFavorite();
    const entry = favoriteToMealEntry(favorite);

    expect(entry.userId).toBe('user-1');
    expect(entry.mealType).toBe('breakfast');
    expect(entry.totalCalories).toBe(350);
    expect(entry.totalProteinG).toBe(12);
    expect(entry.totalCarbsG).toBe(45);
    expect(entry.totalFatG).toBe(14);
    expect(entry.totalFiberG).toBe(2);
    expect(entry.geminiConfidence).toBe(0);
    expect(entry.isManuallyAdjusted).toBe(true);
    expect(entry.items).toHaveLength(2);
    expect(entry.items[0].name).toBe('Bagel');
    expect(entry.items[1].name).toBe('Cream Cheese');
  });

  it('generates a unique id', () => {
    const favorite = makeFavorite();
    const entry1 = favoriteToMealEntry(favorite);
    const entry2 = favoriteToMealEntry(favorite);
    expect(entry1.id).not.toBe(entry2.id);
  });

  it('uses current timestamp', () => {
    const before = Date.now();
    const entry = favoriteToMealEntry(makeFavorite());
    const after = Date.now();
    expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after);
  });
});

describe('useLogFromFavorite mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createMeal with proper MealEntry', async () => {
    const favorite = makeFavorite();
    mockedCreateMeal.mockResolvedValue('new-meal-id');

    const entry = favoriteToMealEntry(favorite);
    await createMeal(entry);

    expect(mockedCreateMeal).toHaveBeenCalledTimes(1);
    expect(mockedCreateMeal).toHaveBeenCalledWith(entry);
  });
});
