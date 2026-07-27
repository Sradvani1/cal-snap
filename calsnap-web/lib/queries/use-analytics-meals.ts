'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
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

  return useQuery({
    queryKey: [
      'analyticsMeals',
      uid ?? '',
      analyticsRangeKey(range, referenceDate),
      rangeStart.getTime(),
      rangeEnd.getTime(),
    ],
    queryFn: () => fetchMealsInRange(uid!, rangeStart, rangeEnd),
    enabled: Boolean(uid),
    staleTime: 0,
  });
}
