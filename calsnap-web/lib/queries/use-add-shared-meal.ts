'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { localDayKey } from '@/lib/dashboard/date-window';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import { queryKeys } from '@/lib/queries/query-keys';
import type { FetchedMeal } from '@/lib/repositories/meals';
import {
  addSharedMealToLog,
  attachSharedMealPhoto,
  type AddedSharedMeal,
} from '@/lib/repositories/shared-meals';

export interface AddSharedMealInput {
  shareId: string;
  entry: MealEntry;
}

export function useAddSharedMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, entry }: AddSharedMealInput): Promise<AddedSharedMeal> => {
      if (!uid) {
        throw notSignedInError();
      }
      return addSharedMealToLog(uid, shareId, entry);
    },
    onSuccess: ({ mealId, created }, { shareId, entry }) => {
      if (!uid) {
        return;
      }
      const dayKey = localDayKey(entry.timestamp);
      void queryClient.invalidateQueries({ queryKey: queryKeys.sharedMeal(uid, shareId) });
      if (!created) {
        return;
      }

      const logged: MealEntry = { ...entry, id: mealId, userId: uid, photoStoragePath: undefined };
      const cached: FetchedMeal = { entry: logged, createdAt: Timestamp.now() };
      queryClient.setQueryData<FetchedMeal>(queryKeys.meal(uid, mealId), cached);
      invalidateMealQueries(queryClient, uid, dayKey);

      if (entry.photoStoragePath) {
        void attachSharedMealPhoto(uid, mealId, entry.photoStoragePath)
          .then(() => invalidateMealQueries(queryClient, uid, dayKey, mealId))
          .catch((error: unknown) => {
            console.warn('Shared meal photo copy failed; meal saved without a photo:', error);
          });
      }
    },
  });
}
