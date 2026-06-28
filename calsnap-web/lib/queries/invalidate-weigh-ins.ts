import type { QueryClient } from '@tanstack/react-query';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';
import { queryKeys } from '@/lib/queries/query-keys';

export function invalidateWeighInQueries(
  queryClient: QueryClient,
  uid: string,
  windowKey?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.allWeighIns(uid) });
  if (windowKey) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.weighIns(uid, windowKey),
    });
  }
  invalidateAnalyticsQueries(queryClient, uid);
}
