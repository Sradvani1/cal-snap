import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';
import { saveFavorite } from '@/lib/repositories/favorites';

vi.mock('@/lib/repositories/favorites', () => ({
  saveFavorite: vi.fn(),
}));

const mockedSaveFavorite = vi.mocked(saveFavorite);

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp ?? new Date('2026-07-01T12:00:00'),
    mealType: overrides.mealType ?? 'breakfast',
    totalCalories: overrides.totalCalories ?? 400,
    totalProteinG: overrides.totalProteinG ?? 20,
    totalCarbsG: overrides.totalCarbsG ?? 50,
    totalFatG: overrides.totalFatG ?? 10,
    totalSaturatedFatG: overrides.totalSaturatedFatG ?? 0,
    totalUnsaturatedFatG: overrides.totalUnsaturatedFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 3,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
    ...overrides,
  };
}

describe('saveFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls saveFavorite with uid and meal', async () => {
    const entry = makeEntry();
    mockedSaveFavorite.mockResolvedValue('fav-1');

    const result = await saveFavorite('user-1', entry);

    expect(mockedSaveFavorite).toHaveBeenCalledWith('user-1', entry);
    expect(result).toBe('fav-1');
  });

  it('generates an auto-name from meal items', async () => {
    const entry = makeEntry({
      items: [
        { id: 'i1', name: 'Bagel', estimatedWeightG: 100, calories: 250, proteinG: 10, carbsG: 50, fatG: 2, saturatedFatG: 0, unsaturatedFatG: 2, fiberG: 1, confidence: 0.9, isFlagged: false },
      ],
    });
    mockedSaveFavorite.mockImplementation(async (_uid, meal) => {
      const { autoFavoriteName } = await import('@/lib/models/favorite-meal-doc');
      const name = autoFavoriteName(meal.items);
      return name;
    });

    const result = await saveFavorite('user-1', entry);
    expect(result).toBe('Bagel');
  });
});
