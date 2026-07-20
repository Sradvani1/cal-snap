'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import { notSignedInError } from '@/lib/copy/errors';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import type { MealEntry } from '@/lib/models/meal-entry';
import { queryKeys } from '@/lib/queries/query-keys';
import { createMeal } from '@/lib/repositories/meals';

export function favoriteToMealEntry(favorite: FavoriteMeal): MealEntry {
  return {
    id: crypto.randomUUID(),
    userId: favorite.userId,
    timestamp: new Date(),
    mealType: favorite.mealType,
    totalCalories: favorite.totalCalories,
    totalProteinG: favorite.totalProteinG,
    totalCarbsG: favorite.totalCarbsG,
    totalFatG: favorite.totalFatG,
    totalFiberG: favorite.totalFiberG,
    geminiConfidence: 0,
    isManuallyAdjusted: true,
    items: favorite.items.map((i) => ({ ...i })),
  };
}

export function useLogFromFavorite(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favorite: FavoriteMeal) => {
      if (!uid) throw notSignedInError();
      const entry = favoriteToMealEntry(favorite);
      await createMeal(entry);
      return entry;
    },
    onSuccess: (entry) => {
      if (!uid) return;
      const dayKey = localDayKey(entry.timestamp);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.todaysMeals(uid, dayKey),
      });
    },
  });
}
