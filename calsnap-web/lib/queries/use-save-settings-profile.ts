'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { notSignedInError } from '@/lib/copy/errors';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { invalidateProfileQueries } from '@/lib/queries/invalidate-profile-queries';
import { queryKeys } from '@/lib/queries/query-keys';
import {
  saveSettingsProfile,
  type SaveSettingsProfileResult,
} from '@/lib/services/save-settings-profile';

export interface SaveSettingsProfileMutationInput {
  profile: UserProfile;
  extras: ProfileExtras;
  draft: ProfileDraft;
  macroProteinPct: number;
  macroCarbsPct: number;
  macroFatPct: number;
  startingWeightKg: number;
  reminderPrefs: ResolvedReminderPrefs;
  unitPrefs: { useLbsForWeight: boolean; useImperialForHeight: boolean };
}

export function useSaveSettingsProfile(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: SaveSettingsProfileMutationInput,
    ): Promise<SaveSettingsProfileResult> => {
      if (!uid) {
        throw notSignedInError();
      }
      return saveSettingsProfile({ uid, ...input });
    },
    onSuccess: (data) => {
      if (!uid) {
        return;
      }
      queryClient.setQueryData(queryKeys.profile(uid), {
        profile: data.profile,
        extras: data.extras,
      });
      invalidateProfileQueries(queryClient, uid);
    },
  });
}
