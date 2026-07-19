import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { saveProfile } from '@/lib/repositories/profile';
import {
  apply,
  applyMacroTargets,
} from '@/lib/services/profile-update-service';
import { normalizeHeightCm, normalizeWeightKg } from '@/lib/utilities/unit-formatters';
import type { Firestore } from 'firebase/firestore';

function normalizeSettingsDraft(
  draft: ProfileDraft,
): ProfileDraft {
  return {
    ...draft,
    heightCm: normalizeHeightCm(draft.heightCm),
    goalWeightKg: normalizeWeightKg(draft.goalWeightKg, draft.useLbsGoalWeight),
  };
}

export function normalizeSettingsFormValues(
  draft: ProfileDraft,
  startingWeightKg: number,
  useLbsForWeight: boolean,
): { draft: ProfileDraft; startingWeightKg: number } {
  return {
    draft: normalizeSettingsDraft(draft),
    startingWeightKg: normalizeWeightKg(startingWeightKg, useLbsForWeight),
  };
}

export interface SaveSettingsProfileInput {
  uid: string;
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

export interface SaveSettingsProfileResult {
  profile: UserProfile;
  extras: ProfileExtras;
  savedDraft: ProfileDraft;
  savedStartingWeightKg: number;
}

export interface SaveSettingsProfileDeps {
  db?: Firestore;
}

export async function saveSettingsProfile(
  input: SaveSettingsProfileInput,
  deps: SaveSettingsProfileDeps = {},
): Promise<SaveSettingsProfileResult> {
  const { draft, startingWeightKg } = normalizeSettingsFormValues(
    input.draft,
    input.startingWeightKg,
    input.unitPrefs.useLbsForWeight,
  );
  const updatedProfile: UserProfile = { ...input.profile };
  apply(updatedProfile, draft, input.extras.currentWeightKg);
  updatedProfile.startingWeightKg = startingWeightKg;
  applyMacroTargets(
    updatedProfile,
    input.macroProteinPct,
    input.macroCarbsPct,
    input.macroFatPct,
  );

  const updatedExtras: ProfileExtras = {
    ...input.extras,
    onboardingCompleted: input.extras.onboardingCompleted,
    useLbsForWeight: input.unitPrefs.useLbsForWeight,
    useImperialForHeight: input.unitPrefs.useImperialForHeight,
    weighInReminderEnabled: input.reminderPrefs.weighInReminderEnabled,
  };

  await saveProfile(input.uid, updatedProfile, updatedExtras, deps.db);
  return {
    profile: updatedProfile,
    extras: updatedExtras,
    savedDraft: draft,
    savedStartingWeightKg: startingWeightKg,
  };
}
