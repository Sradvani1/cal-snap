import type { QueryClient } from '@tanstack/react-query';

export function invalidateAnalyticsQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['analyticsMeals', uid] });
}
