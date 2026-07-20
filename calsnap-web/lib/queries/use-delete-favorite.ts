'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { queryKeys } from '@/lib/queries/query-keys';
import { deleteFavorite } from '@/lib/repositories/favorites';

export function useDeleteFavorite(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteId: string) => {
      if (!uid) throw notSignedInError();
      await deleteFavorite(uid, favoriteId);
    },
    onSuccess: () => {
      if (!uid) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(uid) });
    },
  });
}
