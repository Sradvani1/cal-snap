'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { autoFavoriteName } from '@/lib/models/favorite-meal-doc';
import { queryKeys } from '@/lib/queries/query-keys';
import { saveFavorite } from '@/lib/repositories/favorites';

export function useSaveFavorite(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meal: MealEntry) => {
      if (!uid) throw notSignedInError();
      return saveFavorite(uid, meal);
    },
    onSuccess: (favoriteId, meal) => {
      if (!uid) return;
      const favorite: FavoriteMeal = {
        id: favoriteId,
        userId: uid,
        originalMealId: meal.id,
        name: autoFavoriteName(meal.items),
        mealType: meal.mealType,
        totalCalories: meal.totalCalories,
        totalProteinG: meal.totalProteinG,
        totalCarbsG: meal.totalCarbsG,
        totalFatG: meal.totalFatG,
        totalFiberG: meal.totalFiberG,
        items: meal.items,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      queryClient.setQueryData<FavoriteMeal[]>(
        queryKeys.favorites(uid),
        (old) => (old ? [favorite, ...old] : [favorite]),
      );
    },
  });
}
