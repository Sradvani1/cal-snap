'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMealsInRange } from '@/lib/repositories/meals';
import { startOfLocalDay } from '@/lib/dashboard/date-window';

export interface DailyCalorieSummary {
  date: Date;
  totalCalories: number;
}

export function useDailyCalorieSummaries(
  uid: string | undefined,
  start: Date,
  end: Date,
) {
  return useQuery({
    queryKey: [
      'dailyCalorieSummaries',
      uid ?? '',
      startOfLocalDay(start).getTime(),
      startOfLocalDay(end).getTime(),
    ],
    queryFn: async () => {
      const meals = await fetchMealsInRange(uid!, start, end);
      const byDay = new Map<number, number>();

      for (const meal of meals) {
        const day = startOfLocalDay(meal.timestamp).getTime();
        const existing = byDay.get(day) ?? 0;
        byDay.set(day, existing + meal.totalCalories);
      }

      const summaries: DailyCalorieSummary[] = [];
      const cursor = new Date(startOfLocalDay(start));
      const endTime = startOfLocalDay(end).getTime();

      while (cursor.getTime() <= endTime) {
        const key = cursor.getTime();
        summaries.push({
          date: new Date(cursor),
          totalCalories: byDay.get(key) ?? 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      return summaries;
    },
    enabled: Boolean(uid),
    staleTime: 0,
  });
}
