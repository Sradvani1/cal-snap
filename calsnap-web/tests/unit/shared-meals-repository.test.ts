import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';

const mocks = vi.hoisted(() => ({
  createMeal: vi.fn(),
  uploadMealPhoto: vi.fn(),
  getBlob: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  ref: vi.fn(),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return { ...actual, doc: mocks.doc, getDoc: mocks.getDoc };
});

vi.mock('firebase/storage', () => ({
  getBlob: mocks.getBlob,
  ref: mocks.ref,
  deleteObject: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock('@/lib/firebase/client', () => ({
  getFirebaseStorage: () => ({}),
  getFirestoreDb: () => ({}),
}));

vi.mock('@/lib/repositories/meals', () => ({
  createMeal: mocks.createMeal,
  uploadMealPhoto: mocks.uploadMealPhoto,
}));

import { addSharedMealToLog } from '@/lib/repositories/shared-meals';

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'dinner-1',
    userId: '',
    timestamp: new Date('2026-06-27T19:00:00'),
    mealType: 'dinner',
    totalCalories: 500,
    totalProteinG: 30,
    totalCarbsG: 40,
    totalFatG: 15,
    totalSaturatedFatG: 0,
    totalUnsaturatedFatG: 0,
    totalFiberG: 5,
    geminiConfidence: 0.9,
    isManuallyAdjusted: false,
    items: [],
    ...overrides,
  };
}

function storageError(code: string): Error {
  return Object.assign(new Error(code), { code });
}

describe('addSharedMealToLog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.doc.mockReturnValue({});
    mocks.ref.mockReturnValue({});
    mocks.getDoc.mockResolvedValue({ exists: () => false });
  });

  it('adds the meal without a photo when the shared photo no longer exists', async () => {
    mocks.getBlob.mockRejectedValue(storageError('storage/object-not-found'));

    const mealId = await addSharedMealToLog(
      'bob',
      'share-1',
      makeEntry({ photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg' }),
      {} as never,
    );

    expect(mealId).toBe('shared-share-1');
    expect(mocks.uploadMealPhoto).not.toHaveBeenCalled();
    expect(mocks.createMeal).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'shared-share-1', userId: 'bob', photoStoragePath: undefined }),
      expect.anything(),
    );
  });

  it('fails without adding the meal on other photo errors', async () => {
    mocks.getBlob.mockRejectedValue(storageError('storage/unauthorized'));

    await expect(
      addSharedMealToLog(
        'bob',
        'share-1',
        makeEntry({ photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg' }),
        {} as never,
      ),
    ).rejects.toThrow('storage/unauthorized');
    expect(mocks.createMeal).not.toHaveBeenCalled();
  });

  it('returns the existing copy without rewriting it', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true });

    const mealId = await addSharedMealToLog('bob', 'share-1', makeEntry(), {} as never);

    expect(mealId).toBe('shared-share-1');
    expect(mocks.createMeal).not.toHaveBeenCalled();
  });
});
