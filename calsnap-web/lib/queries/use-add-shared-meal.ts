'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import { queryKeys } from '@/lib/queries/query-keys';
import { addSharedMealToLog } from '@/lib/repositories/shared-meals';

export interface AddSharedMealInput {
  shareId: string;
  entry: MealEntry;
}

export function useAddSharedMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, entry }: AddSharedMealInput) => {
      if (!uid) {
        throw notSignedInError();
      }
      return addSharedMealToLog(uid, shareId, entry);
    },
    onSuccess: (mealId, { shareId, entry }) => {
      if (!uid) {
        return;
      }
      invalidateMealQueries(queryClient, uid, localDayKey(entry.timestamp), mealId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.sharedMeal(uid, shareId) });
    },
  });
}
