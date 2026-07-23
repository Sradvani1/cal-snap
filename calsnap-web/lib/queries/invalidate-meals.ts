import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/query-keys';

export function invalidateMealQueries(
  queryClient: QueryClient,
  uid: string,
  dayKey: string,
  mealId?: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.todaysMeals(uid, dayKey),
  });
  if (mealId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.meal(uid, mealId),
    });
  }
}
