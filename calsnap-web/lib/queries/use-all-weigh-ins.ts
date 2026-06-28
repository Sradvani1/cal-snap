'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAllWeighIns } from '@/lib/repositories/weigh-ins';
import { queryKeys } from '@/lib/queries/query-keys';

export function useAllWeighIns(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.allWeighIns(uid ?? ''),
    queryFn: () => fetchAllWeighIns(uid!),
    enabled: Boolean(uid),
  });
}
