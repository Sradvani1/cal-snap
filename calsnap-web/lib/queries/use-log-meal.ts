'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import { createMeal, uploadMealPhoto } from '@/lib/repositories/meals';

export interface LogMealInput {
  entry: MealEntry;
  photoBlob?: Blob;
}

export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entry, photoBlob }: LogMealInput) => {
      if (!uid) {
        throw notSignedInError();
      }

      let photoStoragePath: string | undefined;
      if (photoBlob) {
        photoStoragePath = await uploadMealPhoto(uid, entry.id, photoBlob);
      }

      const entryWithPhoto: MealEntry = {
        ...entry,
        photoStoragePath,
      };
      await createMeal(entryWithPhoto);
      return entryWithPhoto;
    },
    onSuccess: (entry) => {
      if (!uid) {
        return;
      }
      const dayKey = localDayKey(entry.timestamp);
      invalidateMealQueries(queryClient, uid, dayKey);
    },
  });
}
