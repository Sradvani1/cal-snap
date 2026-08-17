'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { queryKeys } from '@/lib/queries/query-keys';
import { fetchMealsInRange } from '@/lib/repositories/meals';

export interface AnalyticsMealsQueryOptions {
  queryKey: readonly unknown[];
  queryFn: () => Promise<MealEntry[]>;
}

export function analyticsMealsQueryOptions(
  uid: string,
  range: AnalyticsDateRangeType,
  referenceDate: Date,
): AnalyticsMealsQueryOptions {
  const rangeStart = AnalyticsDateRange.resolvedStart(range, referenceDate);
  const rangeEnd = AnalyticsDateRange.resolvedEnd(range, referenceDate);
  const fetchStart = startOfLocalDay(rangeStart);
  fetchStart.setDate(fetchStart.getDate() - 1);

  return {
    queryKey: [
      ...queryKeys.analyticsMeals(uid, analyticsRangeKey(range, referenceDate)),
      rangeStart.getTime(),
      rangeEnd.getTime(),
    ],
    queryFn: () => fetchMealsInRange(uid, fetchStart, rangeEnd),
  };
}

export function useAnalyticsMeals(
  uid: string | undefined,
  range: AnalyticsDateRangeType,
  referenceDate: Date,
) {
  const options = useMemo(
    () => analyticsMealsQueryOptions(uid ?? '', range, referenceDate),
    [uid, range, referenceDate],
  );

  return useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    enabled: Boolean(uid),
  });
}
