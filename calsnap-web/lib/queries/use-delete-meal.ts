'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import { deleteMeal } from '@/lib/repositories/meals';

export interface DeleteMealResult {
  entry: MealEntry;
  dayKey: string;
}

export function useDeleteMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string): Promise<DeleteMealResult> => {
      if (!uid) {
        throw notSignedInError();
      }
      const entry = await deleteMeal(uid, mealId);
      return { entry, dayKey: localDayKey(entry.timestamp) };
    },
    onSuccess: ({ entry, dayKey }) => {
      if (!uid) {
        return;
      }
      invalidateMealQueries(queryClient, uid, dayKey, entry.id);
    },
  });
}
