'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { invalidateProfileQueries } from '@/lib/queries/invalidate-profile-queries';
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
  currentWeightKg: number;
  savedWeightKg: number;
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
        throw new Error('Not signed in');
      }
      return saveSettingsProfile({ uid, ...input });
    },
    onSuccess: () => {
      if (!uid) {
        return;
      }
      invalidateProfileQueries(queryClient, uid);
    },
  });
}
