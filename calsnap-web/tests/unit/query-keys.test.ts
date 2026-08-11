import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateWeighInQueries } from '@/lib/queries/invalidate-weigh-ins';
import { queryKeys } from '@/lib/queries/query-keys';

describe('query keys', () => {
  it('centralizes analytics meal keys', () => {
    expect(queryKeys.analyticsMeals('user-1', '7d')).toEqual([
      'analyticsMeals',
      'user-1',
      '7d',
    ]);
  });

  it('invalidates analytics meals when weigh-ins change', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateWeighInQueries(queryClient, 'user-1');

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['analyticsMeals', 'user-1'] });
  });
});
