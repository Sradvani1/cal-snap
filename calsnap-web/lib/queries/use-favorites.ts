'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFavorites } from '@/lib/repositories/favorites';
import { queryKeys } from '@/lib/queries/query-keys';

export function useFavorites(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favorites(uid ?? ''),
    queryFn: () => fetchFavorites(uid!),
    enabled: Boolean(uid),
    staleTime: 5 * 60 * 1000,
  });
}
