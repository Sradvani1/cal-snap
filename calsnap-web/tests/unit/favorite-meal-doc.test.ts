import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { foodItemToDoc, foodItemDocToEntry } from '@/lib/models/food-item-doc';
import {
  autoFavoriteName,
  favoriteEntryToDoc,
  favoriteDocToEntry,
} from '@/lib/models/favorite-meal-doc';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import type { FoodItem } from '@/lib/models/food-item';

function makeFoodItem(name: string): FoodItem {
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
    name: 'Test Favorite',
    mealType: 'breakfast',
    totalCalories: 500,
    totalProteinG: 30,
    totalCarbsG: 60,
    totalFatG: 15,
    totalFiberG: 5,
    items: [makeFoodItem('Oatmeal'), makeFoodItem('Banana')],
    createdAt: new Date('2026-07-01T10:00:00'),
    updatedAt: new Date('2026-07-01T10:00:00'),
    ...overrides,
  };
}

describe('autoFavoriteName', () => {
  it('returns "Meal" for empty items', () => {
    expect(autoFavoriteName([])).toBe('Meal');
  });

  it('uses single item name', () => {
    expect(autoFavoriteName([makeFoodItem('Bagel')])).toBe('Bagel');
  });

  it('joins up to 3 item names', () => {
    const items = [
      makeFoodItem('Chicken'),
      makeFoodItem('Rice'),
      makeFoodItem('Broccoli'),
    ];
    expect(autoFavoriteName(items)).toBe('Chicken, Rice, Broccoli');
  });

  it('appends count for extras beyond 3', () => {
    const items = [
      makeFoodItem('Chicken'),
      makeFoodItem('Rice'),
      makeFoodItem('Broccoli'),
      makeFoodItem('Sauce'),
    ];
    expect(autoFavoriteName(items)).toBe('Chicken, Rice, Broccoli & 1 more');
  });

  it('truncates at 40 characters', () => {
    const items = [
      makeFoodItem('Super Long Breakfast Item Name'),
      makeFoodItem('Another Even Longer Item Name Here'),
      makeFoodItem('Third Extremely Verbose Item Name'),
    ];
    const result = autoFavoriteName(items);
    expect(result.length).toBeLessThanOrEqual(40);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('favoriteDocToEntry / favoriteEntryToDoc roundtrip', () => {
  it('preserves all fields through roundtrip', () => {
    const original = makeFavorite();
    const doc = favoriteEntryToDoc(original);
    const restored = favoriteDocToEntry(original.id, doc);

    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.name).toBe(original.name);
    expect(restored.mealType).toBe(original.mealType);
    expect(restored.totalCalories).toBe(original.totalCalories);
    expect(restored.totalProteinG).toBe(original.totalProteinG);
    expect(restored.totalCarbsG).toBe(original.totalCarbsG);
    expect(restored.totalFatG).toBe(original.totalFatG);
    expect(restored.totalFiberG).toBe(original.totalFiberG);
    expect(restored.items).toHaveLength(2);
    expect(restored.items[0].name).toBe('Oatmeal');
    // createdAt/updatedAt are set to now by favoriteEntryToDoc
    expect(restored.createdAt.getTime()).toBeGreaterThan(0);
    expect(restored.updatedAt.getTime()).toBeGreaterThan(0);
  });

  it('sets createdAt and updatedAt on doc', () => {
    const entry = makeFavorite();
    const doc = favoriteEntryToDoc(entry);

    expect(doc.createdAt).toBeInstanceOf(Timestamp);
    expect(doc.updatedAt).toBeInstanceOf(Timestamp);
    expect(doc.createdAt.toMillis()).toBeGreaterThan(0);
  });

  it('converts items via foodItemDocToEntry/foodItemToDoc', () => {
    const entry = makeFavorite({
      items: [makeFoodItem('Eggs'), makeFoodItem('Toast')],
    });

    const doc = favoriteEntryToDoc(entry);
    expect(doc.items).toHaveLength(2);

    const restored = favoriteDocToEntry(entry.id, doc);
    expect(restored.items).toHaveLength(2);
    expect(restored.items[0].name).toBe('Eggs');
    expect(restored.items[1].name).toBe('Toast');
  });
});

describe('foodItemDocToEntry / foodItemToDoc roundtrip', () => {
  it('preserves usdaFoodId when set', () => {
    const item: FoodItem = {
      ...makeFoodItem('Test'),
      usdaFoodId: 'usda-123',
    };
    const doc = foodItemToDoc(item);
    expect(doc.usdaFoodId).toBe('usda-123');
    const restored = foodItemDocToEntry(doc);
    expect(restored.usdaFoodId).toBe('usda-123');
  });

  it('omits usdaFoodId when undefined', () => {
    const item = makeFoodItem('No USDA');
    const doc = foodItemToDoc(item);
    expect(doc.usdaFoodId).toBeUndefined();
  });
});
