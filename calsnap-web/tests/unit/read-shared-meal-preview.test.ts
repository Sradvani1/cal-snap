import { Timestamp } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminFirestore: () => ({ collection: mocks.collection }),
}));

import { readSharedMealPreview } from '@/lib/shares/read-shared-meal-preview';

const validMeal = {
  mealType: 'dinner',
  totalCalories: 850,
  items: [{ name: 'Salmon' }],
  photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
};

describe('readSharedMealPreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.collection.mockReturnValue({ doc: mocks.doc });
    mocks.doc.mockReturnValue({ get: mocks.get });
  });

  it('returns the meal and photo path for a live share', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({
        ownerUid: 'alice',
        expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
        meal: validMeal,
      }),
    });

    await expect(readSharedMealPreview('share-1')).resolves.toEqual({
      meal: validMeal,
      photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
    });
    expect(mocks.collection).toHaveBeenCalledWith('sharedMeals');
    expect(mocks.doc).toHaveBeenCalledWith('share-1');
  });

  it('ignores a photoStoragePath that does not belong to the share owner and shareId', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({
        ownerUid: 'alice',
        expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
        meal: { ...validMeal, photoStoragePath: 'users/victim/meals/meal-1/photo.jpg' },
      }),
    });

    const preview = await readSharedMealPreview('share-1');
    expect(preview?.photoStoragePath).toBeUndefined();
  });

  it('returns null for an expired share', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({
        ownerUid: 'alice',
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
        meal: validMeal,
      }),
    });

    await expect(readSharedMealPreview('share-1')).resolves.toBeNull();
  });

  it('returns null for a missing share', async () => {
    mocks.get.mockResolvedValue({ exists: false });

    await expect(readSharedMealPreview('share-1')).resolves.toBeNull();
  });

  it('returns null for a malformed share', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({
        ownerUid: 'alice',
        expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
        meal: { mealType: 'brunch' },
      }),
    });

    await expect(readSharedMealPreview('share-1')).resolves.toBeNull();
  });

  it('returns null and logs when Firestore fails', async () => {
    mocks.get.mockRejectedValue(new Error('admin not configured'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await expect(readSharedMealPreview('share-1')).resolves.toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('share-1'), expect.any(Error));
    } finally {
      warn.mockRestore();
    }
  });
});
