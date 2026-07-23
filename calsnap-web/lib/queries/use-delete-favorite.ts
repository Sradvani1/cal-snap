'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { queryKeys } from '@/lib/queries/query-keys';
import { deleteFavorite } from '@/lib/repositories/favorites';

export function useDeleteFavorite(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteId: string) => {
      if (!uid) throw notSignedInError();
      await deleteFavorite(uid, favoriteId);
    },
    onSuccess: (_data, favoriteId) => {
      if (!uid) return;
      queryClient.setQueryData<FavoriteMeal[]>(
        queryKeys.favorites(uid),
        (old) => old?.filter((f) => f.id !== favoriteId) ?? [],
      );
    },
  });
}
