import { describe, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  increment: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: mocks.collection,
    doc: mocks.doc,
    getDocs: mocks.getDocs,
    increment: mocks.increment,
    updateDoc: mocks.updateDoc,
  };
});

import { fetchFavorites, logFavorite } from '@/lib/repositories/favorites';

function validFavorite() {
  const timestamp = Timestamp.fromDate(new Date('2026-07-01T10:00:00'));
  return {
    userId: 'user-1',
    originalMealId: 'meal-1',
    name: 'Oatmeal',
    mealType: 'breakfast',
    totalCalories: 300,
    totalProteinG: 10,
    totalCarbsG: 40,
    totalFatG: 8,
    totalFiberG: 5,
    items: [
      {
        id: 'item-1',
        name: 'Oatmeal',
        estimatedWeightG: 100,
        calories: 300,
        proteinG: 10,
        carbsG: 40,
        fatG: 8,
        saturatedFatG: 2,
        unsaturatedFatG: 6,
        fiberG: 5,
        confidence: 0.9,
        isFlagged: false,
      },
    ],
    useCount: 1,
    lastUsedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('favorites repository', () => {
  it('skips malformed favorites instead of failing the collection read', async () => {
    mocks.getDocs.mockResolvedValue({
      docs: [
        { id: 'valid', data: () => validFavorite() },
        { id: 'invalid', data: () => ({ userId: 'user-1' }) },
      ],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const favorites = await fetchFavorites('user-1', {} as never);
      expect(favorites).toHaveLength(1);
      expect(favorites[0]?.id).toBe('valid');
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping malformed favorites doc invalid'),
        expect.any(Error),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('increments favorite usage atomically', async () => {
    const incrementValue = { __increment: 1 };
    mocks.doc.mockReturnValue('favorite-ref');
    mocks.increment.mockReturnValue(incrementValue);
    mocks.updateDoc.mockResolvedValue(undefined);

    await logFavorite('user-1', 'favorite-1', {} as never);

    expect(mocks.increment).toHaveBeenCalledWith(1);
    expect(mocks.updateDoc).toHaveBeenCalledWith(
      'favorite-ref',
      expect.objectContaining({ useCount: incrementValue }),
    );
  });
});
