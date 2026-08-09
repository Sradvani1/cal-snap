'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';
import { queryKeys } from '@/lib/queries/query-keys';
import {
  createMeal,
  deleteMealPhoto,
  mealPhotoStoragePath,
  setMealPhotoPath,
  uploadMealPhoto,
} from '@/lib/repositories/meals';

export interface LogMealInput {
  entry: MealEntry;
  photoBlob?: Blob;
}

export async function logMeal(
  uid: string | undefined,
  { entry, photoBlob }: LogMealInput,
): Promise<MealEntry> {
  if (!uid) {
    throw notSignedInError();
  }

  if (!photoBlob) {
    await createMeal(entry);
    return entry;
  }

  const photoPath = mealPhotoStoragePath(uid, entry.id);
  const initialEntry: MealEntry = {
    ...entry,
    photoStoragePath: undefined,
  };
  const [mealResult, photoResult] = await Promise.allSettled([
    createMeal(initialEntry),
    uploadMealPhoto(uid, entry.id, photoBlob),
  ]);

  const cleanupPhoto = async (path: string): Promise<void> => {
    try {
      await deleteMealPhoto(path);
    } catch (error) {
      console.warn('Failed to clean up meal photo after log failure:', error);
    }
  };

  if (mealResult.status === 'rejected') {
    await cleanupPhoto(
      photoResult.status === 'fulfilled' ? photoResult.value : photoPath,
    );
    throw mealResult.reason;
  }

  if (photoResult.status === 'rejected') {
    await cleanupPhoto(photoPath);
    console.warn('Meal photo upload failed; meal saved without a photo:', photoResult.reason);
    return initialEntry;
  }

  try {
    await setMealPhotoPath(uid, entry.id, photoResult.value);
    return {
      ...initialEntry,
      photoStoragePath: photoResult.value,
    };
  } catch (error) {
    await cleanupPhoto(photoResult.value);
    console.warn('Meal photo path update failed; meal saved without a photo:', error);
    return initialEntry;
  }
}

export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMealInput) => logMeal(uid, input),
    onMutate: async (input) => {
      if (!uid) return { dayKey: '' };

      const dayKey = localDayKey(input.entry.timestamp);
      await queryClient.cancelQueries({
        queryKey: queryKeys.todaysMeals(uid, dayKey),
      });

      const previous = queryClient.getQueryData<MealEntry[]>(
        queryKeys.todaysMeals(uid, dayKey),
      );

      if (previous) {
        queryClient.setQueryData(queryKeys.todaysMeals(uid, dayKey), [
          ...previous,
          input.entry,
        ]);
      }

      return { dayKey };
    },
    onSettled: (_data, _error, _input, context) => {
      if (context?.dayKey && uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.todaysMeals(uid, context.dayKey),
        });
        invalidateAnalyticsQueries(queryClient, uid);
      }
    },
  });
}
