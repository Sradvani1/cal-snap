'use client';

import { useQuery } from '@tanstack/react-query';
import { localDayKey } from '@/lib/dashboard/date-window';
import { fetchMealsForCalendarDay } from '@/lib/repositories/meals';
import { queryKeys } from '@/lib/queries/query-keys';

export function useTodaysMeals(uid: string | undefined, day: Date = new Date()) {
  const dayKey = localDayKey(day);

  return useQuery({
    queryKey: queryKeys.todaysMeals(uid ?? '', dayKey),
    queryFn: () => fetchMealsForCalendarDay(uid!, day),
    enabled: Boolean(uid),
  });
}
