'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMeal } from '@/lib/repositories/meals';
import { queryKeys } from '@/lib/queries/query-keys';

export interface UseMealOptions {
  /** When true, always refetch on mount (edit flow). */
  fresh?: boolean;
}

export function useMeal(
  uid: string | undefined,
  mealId: string | undefined,
  options?: UseMealOptions,
) {
  const fresh = options?.fresh ?? false;

  return useQuery({
    queryKey: queryKeys.meal(uid ?? '', mealId ?? ''),
    queryFn: () => {
      if (!uid || !mealId) {
        throw new Error('Missing uid or mealId');
      }
      return fetchMeal(uid, mealId);
    },
    enabled: Boolean(uid && mealId),
    refetchOnMount: fresh ? 'always' : true,
    staleTime: fresh ? 0 : undefined,
  });
}
