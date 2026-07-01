import { AppConstants } from '@/lib/constants';
import type { ActivityLevel } from '@/lib/models/activity-level';
import type { BiologicalSex } from '@/lib/models/biological-sex';

function defaultDateOfBirth(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 35);
  return date;
}

export interface ProfileDraft {
  name: string;
  sex: BiologicalSex;
  dateOfBirth: Date;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  requestedDeficit: number;
  useImperialHeight: boolean;
  useLbsWeight: boolean;
  useLbsGoalWeight: boolean;
}

export function createDefaultProfileDraft(): ProfileDraft {
  return {
    name: '',
    sex: 'male',
    dateOfBirth: defaultDateOfBirth(),
    heightCm: 175,
    weightKg: 80,
    goalWeightKg: 72,
    activityLevel: 'moderatelyActive',
    requestedDeficit: AppConstants.Deficit.defaultDeficitKcal,
    useImperialHeight: false,
    useLbsWeight: true,
    useLbsGoalWeight: true,
  };
}

export function trimmedName(draft: ProfileDraft): string {
  return draft.name.trim();
}
