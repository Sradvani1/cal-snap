'use client';

import { useQuery } from '@tanstack/react-query';
import { getProfileWithExtras } from '@/lib/repositories/profile';
import { queryKeys } from '@/lib/queries/query-keys';

export function useProfile(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(uid ?? ''),
    queryFn: () => getProfileWithExtras(uid!),
    enabled: Boolean(uid),
  });
}
