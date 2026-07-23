'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { queryKeys } from '@/lib/queries/query-keys';
import {
  createMeal,
  deleteMealPhoto,
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

  const photoPath = photoBlob
    ? `users/${uid}/meals/${entry.id}/photo.jpg`
    : undefined;

  const entryWithPhoto: MealEntry = {
    ...entry,
    photoStoragePath: photoPath ?? entry.photoStoragePath,
  };

  const photoPromise = photoBlob
    ? uploadMealPhoto(uid, entry.id, photoBlob)
    : undefined;

  const [mealResult] = await Promise.allSettled([
    createMeal(entryWithPhoto),
    photoPromise,
  ]);

  if (mealResult.status === 'rejected') {
    if (photoBlob) {
      try {
        await deleteMealPhoto(photoPath!);
      } catch {
        // Best-effort cleanup — original meal write error takes precedence.
      }
    }
    throw mealResult.reason;
  }

  // Photo upload failure is non-fatal — meal data is intact.

  return entryWithPhoto;
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
      }
    },
  });
}
