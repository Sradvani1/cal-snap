import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';
import { logMeal } from '@/lib/queries/use-log-meal';

vi.mock('@/lib/repositories/meals', () => ({
  uploadMealPhoto: vi.fn(),
  createMeal: vi.fn(),
  deleteMealPhoto: vi.fn(),
}));

import {
  uploadMealPhoto,
  createMeal,
  deleteMealPhoto,
} from '@/lib/repositories/meals';

const mockedUpload = vi.mocked(uploadMealPhoto);
const mockedCreate = vi.mocked(createMeal);
const mockedDeletePhoto = vi.mocked(deleteMealPhoto);

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: overrides.id ?? 'meal-1',
    userId: overrides.userId ?? 'user-1',
    timestamp: overrides.timestamp ?? new Date('2026-06-27T12:00:00'),
    mealType: overrides.mealType ?? 'lunch',
    totalCalories: overrides.totalCalories ?? 500,
    totalProteinG: overrides.totalProteinG ?? 30,
    totalCarbsG: overrides.totalCarbsG ?? 40,
    totalFatG: overrides.totalFatG ?? 15,
    totalSaturatedFatG: overrides.totalSaturatedFatG ?? 0,
    totalUnsaturatedFatG: overrides.totalUnsaturatedFatG ?? 0,
    totalFiberG: overrides.totalFiberG ?? 5,
    geminiConfidence: overrides.geminiConfidence ?? 0.9,
    isManuallyAdjusted: overrides.isManuallyAdjusted ?? false,
    items: overrides.items ?? [],
    ...overrides,
  };
}

describe('logMeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads photo then creates meal', async () => {
    mockedUpload.mockResolvedValue('users/user-1/meals/meal-1/photo.jpg');
    mockedCreate.mockResolvedValue('meal-1');

    const entry = makeEntry();
    const photoBlob = new Blob(['photo'], { type: 'image/jpeg' });
    const result = await logMeal('user-1', { entry, photoBlob });

    expect(mockedUpload).toHaveBeenCalledWith('user-1', 'meal-1', photoBlob);
    expect(mockedCreate).toHaveBeenCalledWith({
      ...entry,
      photoStoragePath: 'users/user-1/meals/meal-1/photo.jpg',
    });
    expect(mockedDeletePhoto).not.toHaveBeenCalled();
    expect(result.photoStoragePath).toBe('users/user-1/meals/meal-1/photo.jpg');
  });

  it('deletes uploaded photo when createMeal fails', async () => {
    mockedUpload.mockResolvedValue('users/user-1/meals/meal-1/photo.jpg');
    mockedCreate.mockRejectedValue(new Error('Firestore write failed'));

    const entry = makeEntry();
    const photoBlob = new Blob(['photo'], { type: 'image/jpeg' });

    await expect(logMeal('user-1', { entry, photoBlob })).rejects.toThrow(
      'Firestore write failed',
    );
    expect(mockedDeletePhoto).toHaveBeenCalledWith('users/user-1/meals/meal-1/photo.jpg');
  });

  it('does not delete photo when createMeal fails without upload', async () => {
    mockedCreate.mockRejectedValue(new Error('Firestore write failed'));

    const entry = makeEntry();

    await expect(logMeal('user-1', { entry })).rejects.toThrow('Firestore write failed');
    expect(mockedUpload).not.toHaveBeenCalled();
    expect(mockedDeletePhoto).not.toHaveBeenCalled();
  });

  it('preserves existing photoStoragePath when no photoBlob', async () => {
    mockedCreate.mockResolvedValue('meal-1');

    const entry = makeEntry({
      photoStoragePath: 'users/user-1/meals/meal-1/photo.jpg',
    });
    const result = await logMeal('user-1', { entry });

    expect(mockedUpload).not.toHaveBeenCalled();
    expect(mockedCreate).toHaveBeenCalledWith({
      ...entry,
      photoStoragePath: 'users/user-1/meals/meal-1/photo.jpg',
    });
    expect(result.photoStoragePath).toBe('users/user-1/meals/meal-1/photo.jpg');
  });

  it('rethrows createMeal error when compensating delete fails', async () => {
    mockedUpload.mockResolvedValue('users/user-1/meals/meal-1/photo.jpg');
    mockedCreate.mockRejectedValue(new Error('Firestore write failed'));
    mockedDeletePhoto.mockRejectedValue(new Error('Storage delete failed'));

    const entry = makeEntry();
    const photoBlob = new Blob(['photo'], { type: 'image/jpeg' });

    await expect(logMeal('user-1', { entry, photoBlob })).rejects.toThrow(
      'Firestore write failed',
    );
    expect(mockedDeletePhoto).toHaveBeenCalledWith('users/user-1/meals/meal-1/photo.jpg');
  });
});
