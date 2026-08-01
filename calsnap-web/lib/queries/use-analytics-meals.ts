'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { fetchMealsInRange } from '@/lib/repositories/meals';

export function useAnalyticsMeals(
  uid: string | undefined,
  range: AnalyticsDateRangeType,
  referenceDate: Date,
) {
  const rangeStart = useMemo(
    () => AnalyticsDateRange.resolvedStart(range, referenceDate),
    [range, referenceDate],
  );
  const rangeEnd = useMemo(
    () => AnalyticsDateRange.resolvedEnd(range, referenceDate),
    [range, referenceDate],
  );

  const fetchStart = useMemo(() => {
    const start = startOfLocalDay(rangeStart);
    start.setDate(start.getDate() - 1);
    return start;
  }, [rangeStart]);

  return useQuery({
    queryKey: [
      'analyticsMeals',
      uid ?? '',
      analyticsRangeKey(range, referenceDate),
      rangeStart.getTime(),
      rangeEnd.getTime(),
    ],
    queryFn: () => fetchMealsInRange(uid!, fetchStart, rangeEnd),
    enabled: Boolean(uid),
  });
}
