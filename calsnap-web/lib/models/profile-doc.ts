import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
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
}

const finiteNumber = z.number().finite();

export const profileDocSchema = z.object({
  name: z.string(),
  onboardingCompleted: z.boolean(),
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.instanceof(Timestamp),
  heightCm: finiteNumber,
  startingWeightKg: finiteNumber,
  currentWeightKg: finiteNumber,
  goalWeightKg: finiteNumber,
  goalTargetDate: z.instanceof(Timestamp).nullable(),
  activityLevel: z.enum([
    'sedentary',
    'lightlyActive',
    'moderatelyActive',
    'veryActive',
    'extraActive',
  ]),
  dailyCalorieTarget: finiteNumber,
  tdee: finiteNumber,
  deficitKcal: finiteNumber,
  macroTargetProteinPct: finiteNumber,
  macroTargetCarbsPct: finiteNumber,
  macroTargetFatPct: finiteNumber,
  useLbsForWeight: z.boolean(),
  useImperialForHeight: z.boolean(),
  weighInReminderEnabled: z.boolean().optional(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});
