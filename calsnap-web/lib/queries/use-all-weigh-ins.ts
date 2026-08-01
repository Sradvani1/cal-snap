'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAllWeighIns } from '@/lib/repositories/weigh-ins';
import { queryKeys } from '@/lib/queries/query-keys';

export function allWeighInsQueryOptions(uid: string | undefined) {
  return {
    queryKey: queryKeys.allWeighIns(uid ?? ''),
    queryFn: () => fetchAllWeighIns(uid!),
    enabled: Boolean(uid),
    staleTime: 2 * 60 * 1000,
  };
}

export function useAllWeighIns(uid: string | undefined) {
  return useQuery(allWeighInsQueryOptions(uid));
}
