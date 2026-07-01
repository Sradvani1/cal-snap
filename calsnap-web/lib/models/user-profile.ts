import type { ActivityLevel } from '@/lib/models/activity-level';
import type { BiologicalSex } from '@/lib/models/biological-sex';
import { AppConstants } from '@/lib/constants';

/** User profile stored in metric units (kg, cm). */
export interface UserProfile {
  id: string;
  name: string;
  sex: BiologicalSex;
  dateOfBirth: Date;
  /** Height in centimeters. */
  heightCm: number;
  /** Starting weight in kilograms. */
  startingWeightKg: number;
  /** Goal weight in kilograms. */
  goalWeightKg: number;
  goalTargetDate: Date | null;
  activityLevel: ActivityLevel;
  dailyCalorieTarget: number;
  tdee: number;
  deficitKcal: number;
  macroTargetProteinPct: number;
  macroTargetCarbsPct: number;
  macroTargetFatPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_USER_PROFILE_MACROS = {
  macroTargetProteinPct: AppConstants.Nutrition.defaultMacroProteinPct,
  macroTargetCarbsPct: AppConstants.Nutrition.defaultMacroCarbsPct,
  macroTargetFatPct: AppConstants.Nutrition.defaultMacroFatPct,
  deficitKcal: AppConstants.Deficit.defaultDeficitKcal,
} as const;
