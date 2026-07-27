'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
import { endOfLocalDayExclusive } from '@/lib/dashboard/date-window';
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
    queryFn: () => fetchWeighInsInWindow(uid!, rangeStart, windowEnd),
    enabled: Boolean(uid),
    staleTime: 0,
  });
}
