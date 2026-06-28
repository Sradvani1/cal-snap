'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { copy } from '@/lib/copy';
import { executePlateauDietBreak } from '@/lib/dashboard/plateau-actions';
import {
  applySmallReductionTargets,
  plateauSnoozeEndDate,
  plateauSnoozeKey,
  shouldShowPlateauAlert,
  storeDate,
} from '@/lib/dashboard/plateau-state';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';
import { updateCalorieTargets } from '@/lib/repositories/profile';
import { queryKeys } from '@/lib/queries/query-keys';
import { useProfile } from '@/lib/queries/use-profile';
import { useRecentWeighIns } from '@/lib/queries/use-recent-weigh-ins';

function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function usePlateauAlert(uid: string | undefined) {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const profileQuery = useProfile(uid);
  const weighInsQuery = useRecentWeighIns(uid, now);
  const [plateauDismissed, setPlateauDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const plateauStorageReady = useClientMounted();

  const profile = profileQuery.data?.profile ?? null;
  const plateauWeighIns = weighInsQuery.data?.plateauWeighIns ?? [];

  const showPlateauAlert =
    plateauStorageReady &&
    !plateauDismissed &&
    shouldShowPlateauAlert(profile, plateauWeighIns, uid ?? '', now);

  const invalidateProfile = useCallback(async () => {
    if (!uid) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
    invalidateAnalyticsQueries(queryClient, uid);
  }, [queryClient, uid]);

  const applyDietBreak = useCallback(async () => {
    if (!uid || !profile) {
      return;
    }
    setActionError(null);
    const result = await executePlateauDietBreak(uid, profile, updateCalorieTargets);
    if (result.ok) {
      setPlateauDismissed(true);
      await invalidateProfile();
    } else {
      setActionError(result.error);
    }
  }, [uid, profile, invalidateProfile]);

  const applySmallReduction = useCallback(async () => {
    if (!uid || !profile) {
      return;
    }
    setActionError(null);
    const updated = applySmallReductionTargets(profile);
    try {
      await updateCalorieTargets(uid, {
        dailyCalorieTarget: updated.dailyCalorieTarget,
        deficitKcal: updated.deficitKcal,
      });
      setPlateauDismissed(true);
      await invalidateProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : copy('dashboard.plateau.error.saveFailed'));
    }
  }, [uid, profile, invalidateProfile]);

  const dismissPlateauAlert = useCallback(() => {
    if (uid) {
      storeDate(plateauSnoozeKey(uid), plateauSnoozeEndDate());
    }
    setPlateauDismissed(true);
  }, [uid]);

  return {
    showPlateauAlert,
    applyDietBreak,
    applySmallReduction,
    dismissPlateauAlert,
    actionError,
  };
}
