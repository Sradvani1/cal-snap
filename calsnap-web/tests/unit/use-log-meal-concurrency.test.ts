import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealEntry } from '@/lib/models/meal-entry';

const { queryClient } = vi.hoisted(() => ({
  queryClient: {
    cancelQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => options,
  useQueryClient: () => queryClient,
}));

import { useLogMeal } from '@/lib/queries/use-log-meal';

function makeEntry(id: string): MealEntry {
  return {
    id,
    userId: 'user-1',
    timestamp: new Date('2026-07-01T12:00:00'),
    mealType: 'lunch',
    totalCalories: 500,
    totalProteinG: 30,
    totalCarbsG: 40,
    totalFatG: 15,
    totalSaturatedFatG: 5,
    totalUnsaturatedFatG: 10,
    totalFiberG: 5,
    geminiConfidence: 0.9,
    isManuallyAdjusted: false,
    items: [],
  };
}

describe('useLogMeal optimistic updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.cancelQueries.mockResolvedValue(undefined);
  });

  it('preserves both entries when mutations overlap', async () => {
    let cache: MealEntry[] = [];
    queryClient.setQueryData.mockImplementation(
      (_key: unknown, updater: (previous: MealEntry[]) => MealEntry[]) => {
        cache = updater(cache);
      },
    );
    const mutation = useLogMeal('user-1') as unknown as {
      onMutate: (input: { entry: MealEntry }) => Promise<unknown>;
    };

    await Promise.all([
      mutation.onMutate({ entry: makeEntry('meal-1') }),
      mutation.onMutate({ entry: makeEntry('meal-2') }),
    ]);

    expect(cache.map((entry) => entry.id)).toEqual(['meal-1', 'meal-2']);
  });
});
