'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMealsForCalendarDay } from '@/lib/repositories/meals';
import { queryKeys } from '@/lib/queries/query-keys';

export function useTodaysMeals(uid: string | undefined, day: Date = new Date()) {
  const dayKey = dayKeyFromDate(day);

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

function dayKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
