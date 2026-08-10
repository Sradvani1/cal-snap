'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveReminderPrefsFromExtras } from '@/lib/progress/reminder-prefs';
import { shouldShowWeighInReminderBanner } from '@/lib/progress/weigh-in-reminder';
import { queryKeys } from '@/lib/queries/query-keys';
import { useProfile } from '@/lib/queries/use-profile';
import { fetchLatestWeighIn } from '@/lib/repositories/weigh-ins';
import { useNow } from '@/lib/hooks/use-now';

type ReminderInput = Parameters<typeof shouldShowWeighInReminderBanner>[0];

export function shouldShowReminderAfterQuery(
  queryError: boolean,
  input: ReminderInput,
): boolean {
  return queryError ? false : shouldShowWeighInReminderBanner(input);
}

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
    if (!profile || !extras || !uid || weighInsQuery.isError) {
      return false;
    }

    const prefs = resolveReminderPrefsFromExtras(extras);

    return shouldShowReminderAfterQuery(weighInsQuery.isError, {
      prefs,
      latestWeighIn: weighInsQuery.data,
      profileCreatedAt: profile.createdAt,
      uid,
      now,
    });
  }, [profileQuery.data, weighInsQuery.data, weighInsQuery.isError, uid, now]);

  const isLoading = profileQuery.isLoading || weighInsQuery.isLoading;

  return { shouldShow: !isLoading && shouldShow, isLoading };
}
