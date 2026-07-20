'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import { queryKeys } from '@/lib/queries/query-keys';
import { saveFavorite } from '@/lib/repositories/favorites';

export function useSaveFavorite(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: MealEntry) => {
      if (!uid) throw notSignedInError();
      return saveFavorite(uid, meal);
    },
    onSuccess: () => {
      if (!uid) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(uid) });
    },
  });
}
