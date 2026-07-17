import type { QueryClient } from '@tanstack/react-query';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';

export function invalidateWeighInQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['profile', uid] });
  void queryClient.invalidateQueries({ queryKey: ['allWeighIns', uid] });
  void queryClient.invalidateQueries({ queryKey: ['weighIns', uid] });
  invalidateAnalyticsQueries(queryClient, uid);
}
