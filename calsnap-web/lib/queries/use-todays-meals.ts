'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMealsForCalendarDay } from '@/lib/repositories/meals';
import { queryKeys } from '@/lib/queries/query-keys';
import { toLocalDayKey } from '@/lib/utilities/date-input';

export function useTodaysMeals(uid: string | undefined, day: Date = new Date()) {
  const dayKey = toLocalDayKey(day);

  return useQuery({
    queryKey: queryKeys.todaysMeals(uid ?? '', dayKey),
    queryFn: ({ queryKey }) => {
      const key = queryKey[2] as string;
      const [y, m, d] = key.split('-').map(Number);
      return fetchMealsForCalendarDay(uid!, new Date(y, m - 1, d));
    },
    enabled: Boolean(uid),
  });
}
