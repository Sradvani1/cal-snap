import type { QueryClient } from '@tanstack/react-query';

export function invalidateWeighInQueries(
  queryClient: QueryClient,
  uid: string,
): void {
  void queryClient.invalidateQueries({ queryKey: ['profile', uid] });
  void queryClient.invalidateQueries({ queryKey: ['allWeighIns', uid] });
  void queryClient.invalidateQueries({ queryKey: ['weighIns', uid] });
}
