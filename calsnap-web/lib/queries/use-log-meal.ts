'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { createMeal, uploadMealPhoto } from '@/lib/repositories/meals';
import { queryKeys } from '@/lib/queries/query-keys';

export interface LogMealInput {
  entry: MealEntry;
  photoBlob?: Blob;
}

export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entry, photoBlob }: LogMealInput) => {
      if (!uid) {
        throw new Error('Not signed in');
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
    onSuccess: () => {
      if (!uid) {
        return;
      }
      const dayKey = localDayKey(new Date());
      void queryClient.invalidateQueries({
        queryKey: queryKeys.todaysMeals(uid, dayKey),
      });
    },
  });
}
