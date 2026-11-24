'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/query-keys';
import { fetchSharedMeal, SharedMealUnavailableError } from '@/lib/repositories/shared-meals';

export function useSharedMeal(uid: string | undefined, shareId: string) {
  return useQuery({
    queryKey: queryKeys.sharedMeal(uid ?? '', shareId),
    queryFn: () => {
      if (!uid) {
        throw new Error('Missing uid');
      }
      return fetchSharedMeal(uid, shareId);
    },
    enabled: Boolean(uid),
    retry: (failureCount, error) =>
      !(error instanceof SharedMealUnavailableError) && failureCount < 2,
  });
}
