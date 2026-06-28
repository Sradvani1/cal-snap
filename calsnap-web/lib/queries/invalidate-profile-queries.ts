import type { QueryClient } from '@tanstack/react-query';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';
import { queryKeys } from '@/lib/queries/query-keys';

export function invalidateProfileQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.allWeighIns(uid) });
  void queryClient.invalidateQueries({ queryKey: ['todaysMeals', uid] });
  void queryClient.invalidateQueries({ queryKey: ['weighIns', uid] });
  invalidateAnalyticsQueries(queryClient, uid);
  void queryClient.invalidateQueries({ queryKey: ['meal', uid] });
}
