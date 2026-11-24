import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';

const mocks = vi.hoisted(() => ({
  createMeal: vi.fn(),
  uploadMealPhoto: vi.fn(),
  setMealPhotoPath: vi.fn(),
  deleteMealPhoto: vi.fn(),
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
  setMealPhotoPath: mocks.setMealPhotoPath,
  deleteMealPhoto: mocks.deleteMealPhoto,
}));

import { addSharedMealToLog, attachSharedMealPhoto } from '@/lib/repositories/shared-meals';

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
    mocks.getDoc.mockResolvedValue({ exists: () => false });
  });

  it('saves the meal without its photo and reports it was created', async () => {
    const result = await addSharedMealToLog(
      'bob',
      'share-1',
      makeEntry({ photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg' }),
      {} as never,
    );

    expect(result).toEqual({ mealId: 'shared-share-1', created: true });
    expect(mocks.getBlob).not.toHaveBeenCalled();
    expect(mocks.createMeal).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'shared-share-1', userId: 'bob', photoStoragePath: undefined }),
      expect.anything(),
    );
  });

  it('returns the existing copy without rewriting it', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true });

    const result = await addSharedMealToLog('bob', 'share-1', makeEntry(), {} as never);

    expect(result).toEqual({ mealId: 'shared-share-1', created: false });
    expect(mocks.createMeal).not.toHaveBeenCalled();
  });
});

describe('attachSharedMealPhoto', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.ref.mockReturnValue({});
  });

  it('copies the photo and attaches it to the meal', async () => {
    mocks.getBlob.mockResolvedValue(new Blob(['x']));
    mocks.uploadMealPhoto.mockResolvedValue('users/bob/meals/shared-share-1/photo.jpg');

    await attachSharedMealPhoto('bob', 'shared-share-1', 'sharedMeals/alice/share-1/photo.jpg');

    expect(mocks.uploadMealPhoto).toHaveBeenCalledWith('bob', 'shared-share-1', expect.any(Blob));
    expect(mocks.setMealPhotoPath).toHaveBeenCalledWith(
      'bob',
      'shared-share-1',
      'users/bob/meals/shared-share-1/photo.jpg',
    );
  });

  it('does nothing when the shared photo is missing or no longer readable', async () => {
    for (const code of ['storage/object-not-found', 'storage/unauthorized']) {
      mocks.getBlob.mockRejectedValueOnce(storageError(code));

      await expect(
        attachSharedMealPhoto('bob', 'shared-share-1', 'sharedMeals/alice/share-1/photo.jpg'),
      ).resolves.toBeUndefined();
    }
    expect(mocks.uploadMealPhoto).not.toHaveBeenCalled();
    expect(mocks.setMealPhotoPath).not.toHaveBeenCalled();
  });

  it('rethrows other photo errors', async () => {
    mocks.getBlob.mockRejectedValue(storageError('storage/quota-exceeded'));

    await expect(
      attachSharedMealPhoto('bob', 'shared-share-1', 'sharedMeals/alice/share-1/photo.jpg'),
    ).rejects.toThrow('storage/quota-exceeded');
    expect(mocks.setMealPhotoPath).not.toHaveBeenCalled();
  });

  it('removes the uploaded photo when it cannot be attached to the meal', async () => {
    mocks.getBlob.mockResolvedValue(new Blob(['x']));
    mocks.uploadMealPhoto.mockResolvedValue('users/bob/meals/shared-share-1/photo.jpg');
    mocks.setMealPhotoPath.mockRejectedValue(new Error('meal deleted'));

    await expect(
      attachSharedMealPhoto('bob', 'shared-share-1', 'sharedMeals/alice/share-1/photo.jpg'),
    ).rejects.toThrow('meal deleted');
    expect(mocks.deleteMealPhoto).toHaveBeenCalledWith('users/bob/meals/shared-share-1/photo.jpg');
  });
});
