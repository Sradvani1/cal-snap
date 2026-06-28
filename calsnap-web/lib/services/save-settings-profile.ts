import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import type { ResolvedReminderPrefs } from '@/lib/progress/reminder-prefs';
import { saveProfile } from '@/lib/repositories/profile';
import {
  apply,
  applyMacroTargets,
} from '@/lib/services/profile-update-service';
import { saveWeighIn } from '@/lib/services/weigh-in-service';
import type { Firestore } from 'firebase/firestore';

const WEIGHT_CHANGE_THRESHOLD_KG = 0.05;

export interface SaveSettingsProfileInput {
  uid: string;
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

export interface SaveSettingsProfileResult {
  profile: UserProfile;
  extras: ProfileExtras;
  didTriggerPlateau: boolean;
}

export interface SaveSettingsProfileDeps {
  db?: Firestore;
}

export async function saveSettingsProfile(
  input: SaveSettingsProfileInput,
  deps: SaveSettingsProfileDeps = {},
): Promise<SaveSettingsProfileResult> {
  const updatedProfile: UserProfile = { ...input.profile };
  apply(updatedProfile, input.draft, input.currentWeightKg);
  applyMacroTargets(
    updatedProfile,
    input.macroProteinPct,
    input.macroCarbsPct,
    input.macroFatPct,
  );

  const updatedExtras: ProfileExtras = {
    ...input.extras,
    onboardingCompleted: input.extras.onboardingCompleted,
    currentWeightKg: input.currentWeightKg,
    useLbsForWeight: input.unitPrefs.useLbsForWeight,
    useImperialForHeight: input.unitPrefs.useImperialForHeight,
    ...input.reminderPrefs,
  };

  const weightChanged =
    Math.abs(input.currentWeightKg - input.savedWeightKg) >= WEIGHT_CHANGE_THRESHOLD_KG;

  if (weightChanged) {
    const result = await saveWeighIn(
      {
        uid: input.uid,
        profile: updatedProfile,
        profileExtras: updatedExtras,
        newWeightKg: input.currentWeightKg,
        date: new Date(),
      },
      { db: deps.db },
    );
    return {
      profile: result.updatedProfile,
      extras: { ...updatedExtras, currentWeightKg: input.currentWeightKg },
      didTriggerPlateau: result.didTriggerPlateau,
    };
  }

  await saveProfile(input.uid, updatedProfile, updatedExtras, deps.db);
  return {
    profile: updatedProfile,
    extras: updatedExtras,
    didTriggerPlateau: false,
  };
}
