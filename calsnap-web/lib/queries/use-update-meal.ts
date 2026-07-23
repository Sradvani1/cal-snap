'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import { updateMeal } from '@/lib/repositories/meals';

export interface UpdateMealInput {
  entry: MealEntry;
}

export function useUpdateMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entry }: UpdateMealInput) => {
      if (!uid) {
        throw notSignedInError();
      }
      await updateMeal(entry);
      return entry;
    },
    onSuccess: (entry) => {
      if (!uid) {
        return;
      }
      const dayKey = localDayKey(entry.timestamp);
      invalidateMealQueries(queryClient, uid, dayKey, entry.id);
    },
  });
}
