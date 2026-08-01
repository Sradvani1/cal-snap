'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveReminderPrefsFromExtras } from '@/lib/progress/reminder-prefs';
import { shouldShowWeighInReminderBanner } from '@/lib/progress/weigh-in-reminder';
import { queryKeys } from '@/lib/queries/query-keys';
import { useProfile } from '@/lib/queries/use-profile';
import { fetchLatestWeighIn } from '@/lib/repositories/weigh-ins';
import { useNow } from '@/lib/hooks/use-now';

export function useWeighInReminder(uid: string | undefined) {
  const now = useNow();
  const profileQuery = useProfile(uid);
  const weighInsQuery = useQuery({
    queryKey: queryKeys.latestWeighIn(uid ?? ''),
    queryFn: () => fetchLatestWeighIn(uid!),
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
      latestWeighIn: weighInsQuery.data,
      profileCreatedAt: profile.createdAt,
      uid,
      now,
    });
  }, [profileQuery.data, weighInsQuery.data, uid, now]);

  const isLoading = profileQuery.isLoading || weighInsQuery.isLoading;

  return { shouldShow: !isLoading && shouldShow, isLoading };
}
