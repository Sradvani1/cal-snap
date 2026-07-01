import { Timestamp } from 'firebase/firestore';
import type { ActivityLevel } from '@/lib/models/activity-level';
import type { BiologicalSex } from '@/lib/models/biological-sex';

/** Firestore document at `users/{uid}/profile/main`. */
export interface ProfileDoc {
  name: string;
  onboardingCompleted: boolean;

  sex: BiologicalSex;
  dateOfBirth: Timestamp;
  heightCm: number;
  startingWeightKg: number;
  currentWeightKg: number;
  goalWeightKg: number;
  goalTargetDate: Timestamp | null;
  activityLevel: ActivityLevel;

  dailyCalorieTarget: number;
  tdee: number;
  deficitKcal: number;
  macroTargetProteinPct: number;
  macroTargetCarbsPct: number;
  macroTargetFatPct: number;

  useLbsForWeight: boolean;
  useImperialForHeight: boolean;

  weighInReminderEnabled?: boolean;
  weighInReminderWeekday?: number;
  weighInReminderHour?: number;
  weighInReminderMinute?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const PROFILE_DOC_ID = 'main';

export interface ProfileExtras {
  onboardingCompleted: boolean;
  currentWeightKg: number;
  useLbsForWeight: boolean;
  useImperialForHeight: boolean;
  weighInReminderEnabled?: boolean;
  weighInReminderWeekday?: number;
  weighInReminderHour?: number;
  weighInReminderMinute?: number;
}
