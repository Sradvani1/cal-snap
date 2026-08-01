'use client';

import { useQuery } from '@tanstack/react-query';
import { AppConstants } from '@/lib/constants';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { WeighIn } from '@/lib/models/weigh-in';
import { queryKeys } from '@/lib/queries/query-keys';
import { allWeighInsQueryOptions } from '@/lib/queries/use-all-weigh-ins';
import {
  selectPlateauWeighIns,
  sortWeighInsNewestFirst,
} from '@/lib/progress/progress-stats';
import { fetchAllWeighIns, fetchWeeklyPlateauWeighIns } from '@/lib/repositories/weigh-ins';

export type WeighInSource = 'window' | 'all';

export function useRecentWeighIns(
  uid: string | undefined,
  referenceDate: Date = new Date(),
  source: WeighInSource = 'window',
) {
  const windowKey = localDayKey(referenceDate);
  const isAll = source === 'all';
  const allOptions = allWeighInsQueryOptions(uid);

  // Window mode retains the ['weighIns', uid, windowKey] key (now a plateau-only
  // read) so invalidateWeighInQueries(['weighIns', uid]) keeps invalidating it.
  return useQuery<WeighIn[], Error, { plateauWeighIns: WeighIn[] }>({
    queryKey: isAll ? allOptions.queryKey : queryKeys.weighIns(uid ?? '', windowKey),
    queryFn: isAll ? () => fetchAllWeighIns(uid!) : () => fetchWeeklyPlateauWeighIns(uid!),
    enabled: Boolean(uid),
    staleTime: isAll ? allOptions.staleTime : undefined,
    select: (data) =>
      isAll
        ? {
            plateauWeighIns: selectPlateauWeighIns(
              sortWeighInsNewestFirst(data).slice(
                0,
                AppConstants.Plateau.weeksToDetect * 4,
              ),
            ),
          }
        : { plateauWeighIns: data },
  });
}
