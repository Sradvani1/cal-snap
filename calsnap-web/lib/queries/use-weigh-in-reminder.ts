'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { latestWeighIn } from '@/lib/progress/progress-stats';
import { resolveReminderPrefsFromExtras } from '@/lib/progress/reminder-prefs';
import { shouldShowWeighInReminderBanner } from '@/lib/progress/weigh-in-reminder';
import { queryKeys } from '@/lib/queries/query-keys';
import { useProfile } from '@/lib/queries/use-profile';
import { fetchAllWeighIns } from '@/lib/repositories/weigh-ins';

export function useWeighInReminder(uid: string | undefined) {
  const profileQuery = useProfile(uid);
  const weighInsQuery = useQuery({
    queryKey: queryKeys.allWeighIns(uid ?? ''),
    queryFn: () => fetchAllWeighIns(uid!),
    enabled: Boolean(uid),
  });

  const shouldShow = useMemo(() => {
    const profile = profileQuery.data?.profile;
    const extras = profileQuery.data?.extras;
    if (!profile || !extras || !uid) {
      return false;
    }

    const prefs = resolveReminderPrefsFromExtras(extras);

    return shouldShowWeighInReminderBanner({
      prefs,
      latestWeighIn: latestWeighIn(weighInsQuery.data ?? []),
      profileCreatedAt: profile.createdAt,
      uid,
    });
  }, [profileQuery.data, weighInsQuery.data, uid]);

  const isLoading = profileQuery.isLoading || weighInsQuery.isLoading;

  return { shouldShow: !isLoading && shouldShow, isLoading };
}
