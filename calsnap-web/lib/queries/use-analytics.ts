'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AnalyticsDateRange,
  analyticsRangeKey,
  type AnalyticsDateRange as AnalyticsDateRangeType,
} from '@/lib/analytics/analytics-types';
import { buildAnalyticsSnapshot } from '@/lib/analytics/build-analytics-snapshot';
import { copy } from '@/lib/copy';
import { endOfLocalDayExclusive } from '@/lib/dashboard/date-window';
import { fetchMealsInRange } from '@/lib/repositories/meals';
import { getProfileWithExtras } from '@/lib/repositories/profile';
import { fetchWeighInsInWindow } from '@/lib/repositories/weigh-ins';
import { queryKeys } from '@/lib/queries/query-keys';

export function useAnalytics(
  uid: string | undefined,
  selectedRange: AnalyticsDateRangeType,
) {
  const referenceDate = useMemo(() => new Date(), []);
  const rangeKey = analyticsRangeKey(selectedRange, referenceDate);

  return useQuery({
    queryKey: queryKeys.analyticsMeals(uid ?? '', rangeKey),
    queryFn: async () => {
      const profileResult = await getProfileWithExtras(uid!);
      if (!profileResult?.profile) {
        throw new Error(copy('analytics.error.loadFailed'));
      }
      const profile = profileResult.profile;

      const rangeStart = AnalyticsDateRange.resolvedStart(selectedRange, referenceDate);
      const rangeEnd = AnalyticsDateRange.resolvedEnd(selectedRange, referenceDate);

      const [meals, weighInsInRange] = await Promise.all([
        fetchMealsInRange(uid!, rangeStart, rangeEnd),
        fetchWeighInsInWindow(
          uid!,
          rangeStart,
          endOfLocalDayExclusive(rangeEnd),
        ),
      ]);

      const snapshot = buildAnalyticsSnapshot({
        meals,
        profile,
        range: selectedRange,
        weighInsInRange,
        referenceDate,
      });

      return { snapshot, profileResult };
    },
    enabled: Boolean(uid),
    staleTime: 30_000,
  });
}
