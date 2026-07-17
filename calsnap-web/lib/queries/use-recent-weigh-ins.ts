'use client';

import { useQuery } from '@tanstack/react-query';
import { lastNDaysWindow, localDayKey } from '@/lib/dashboard/date-window';
import {
  fetchWeeklyPlateauWeighIns,
  fetchWeighInsInWindow,
} from '@/lib/repositories/weigh-ins';
import { queryKeys } from '@/lib/queries/query-keys';

export function useRecentWeighIns(uid: string | undefined, referenceDate: Date = new Date()) {
  const { start, end } = lastNDaysWindow(30, referenceDate);
  const windowKey = localDayKey(referenceDate);

  return useQuery({
    queryKey: queryKeys.weighIns(uid ?? '', windowKey),
    queryFn: async () => {
      const [chartWeighIns, plateauWeighIns] = await Promise.all([
        fetchWeighInsInWindow(uid!, start, end),
        fetchWeeklyPlateauWeighIns(uid!),
      ]);
      return { chartWeighIns, plateauWeighIns };
    },
    enabled: Boolean(uid),
  });
}
