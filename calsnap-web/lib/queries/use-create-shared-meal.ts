'use client';

import { useMutation } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { createSharedMeal } from '@/lib/repositories/shared-meals';

export function useCreateSharedMeal(uid: string | undefined) {
  return useMutation({
    mutationFn: async (entry: MealEntry) => {
      if (!uid) {
        throw notSignedInError();
      }
      return createSharedMeal(uid, entry);
    },
  });
}
