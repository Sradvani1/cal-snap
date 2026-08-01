'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
import { endOfLocalDayExclusive, startOfLocalDay } from '@/lib/dashboard/date-window';
import { fetchWeighInsInWindow } from '@/lib/repositories/weigh-ins';

export function useAnalyticsWeighIns(
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

  const windowEnd = useMemo(
    () => endOfLocalDayExclusive(rangeEnd),
    [rangeEnd],
  );

  return useQuery({
    queryKey: [
      'analyticsWeighIns',
      uid ?? '',
      analyticsRangeKey(range, referenceDate),
      rangeStart.getTime(),
      rangeEnd.getTime(),
    ],
    queryFn: () => fetchWeighInsInWindow(uid!, fetchStart, windowEnd),
    enabled: Boolean(uid),
  });
}
