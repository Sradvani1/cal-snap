import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';

export function profileDraftFromProfile(
  profile: UserProfile,
  extras: ProfileExtras,
  currentWeightKg: number,
): ProfileDraft {
  return {
    name: profile.name,
    sex: profile.sex,
    dateOfBirth: profile.dateOfBirth,
    heightCm: profile.heightCm,
    weightKg: currentWeightKg,
    goalWeightKg: profile.goalWeightKg,
    goalTargetDate: profile.goalTargetDate,
    activityLevel: profile.activityLevel,
    requestedDeficit: profile.deficitKcal,
    useImperialHeight: extras.useImperialForHeight,
    useLbsWeight: extras.useLbsForWeight,
    useLbsGoalWeight: extras.useLbsForWeight,
  };
}
