import { AppConstants } from '@/lib/constants';
import type { BiologicalSex } from '@/lib/models/biological-sex';
import type { ActivityLevel } from '@/lib/models/activity-level';
import type { UserProfile } from '@/lib/models/user-profile';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { trimmedName } from '@/lib/onboarding/profile-draft';
import {
  ageFromDateOfBirth,
  bmr,
  dailyTarget,
  tdee,
} from '@/lib/nutrition/calculator';

export type MacroKind = 'protein' | 'carbs' | 'fat';

export interface PreviewResult {
  tdee: number;
  dailyTarget: number;
  deficitKcal: number;
  minimumCalories: number;
}

export function preview(input: {
  sex: BiologicalSex;
  dateOfBirth: Date;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  deficitKcal: number;
}): PreviewResult {
  const age = ageFromDateOfBirth(input.dateOfBirth);
  const bmrValue = bmr(input.weightKg, input.heightCm, age, input.sex);
  const tdeeValue = tdee(bmrValue, input.activityLevel);
  const targetResult = dailyTarget(tdeeValue, input.deficitKcal, input.sex);
  const minimum =
    input.sex === 'male'
      ? AppConstants.Deficit.minCaloriesMale
      : AppConstants.Deficit.minCaloriesFemale;

  return {
    tdee: Math.round(tdeeValue),
    dailyTarget: targetResult.target,
    deficitKcal: targetResult.deficit,
    minimumCalories: minimum,
  };
}

export function apply(
  profile: UserProfile,
  draft: ProfileDraft,
  weightKg: number,
): void {
  const result = preview({
    sex: draft.sex,
    dateOfBirth: draft.dateOfBirth,
    heightCm: draft.heightCm,
    weightKg,
    activityLevel: draft.activityLevel,
    deficitKcal: profile.deficitKcal,
  });

  profile.name = trimmedName(draft);
  profile.sex = draft.sex;
  profile.dateOfBirth = draft.dateOfBirth;
  profile.heightCm = draft.heightCm;
  profile.goalWeightKg = draft.goalWeightKg;
  profile.goalTargetDate = draft.goalTargetDate;
  profile.activityLevel = draft.activityLevel;
  profile.tdee = result.tdee;
  profile.dailyCalorieTarget = result.dailyTarget;
  profile.deficitKcal = result.deficitKcal;
  profile.updatedAt = new Date();
}

export function applyMacroTargets(
  profile: UserProfile,
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): void {
  profile.macroTargetProteinPct = proteinPct / 100;
  profile.macroTargetCarbsPct = carbsPct / 100;
  profile.macroTargetFatPct = fatPct / 100;
  profile.updatedAt = new Date();
}

export function macroPercentsAreValid(
  protein: number,
  carbs: number,
  fat: number,
): boolean {
  return protein >= 0 && carbs >= 0 && fat >= 0 && protein + carbs + fat === 100;
}

export function normalizedMacroPercents(
  protein: number,
  carbs: number,
  fat: number,
): [number, number, number] {
  if (macroPercentsAreValid(protein, carbs, fat)) {
    return [protein, carbs, fat];
  }
  const sum = protein + carbs + fat;
  if (sum <= 0) {
    return [
      Math.round(AppConstants.Nutrition.defaultMacroProteinPct * 100),
      Math.round(AppConstants.Nutrition.defaultMacroCarbsPct * 100),
      Math.round(AppConstants.Nutrition.defaultMacroFatPct * 100),
    ];
  }
  const p = Math.round((protein / sum) * 100);
  const c = Math.round((carbs / sum) * 100);
  const f = 100 - p - c;
  return [Math.max(0, p), Math.max(0, c), Math.max(0, f)];
}

export function adjustMacroPercents(
  changed: MacroKind,
  newValue: number,
  protein: number,
  carbs: number,
  fat: number,
): [number, number, number] {
  const clamped = Math.min(Math.max(newValue, 0), 100);
  let p = protein;
  let c = carbs;
  let f = fat;

  switch (changed) {
    case 'protein': {
      p = clamped;
      const remaining = 100 - p;
      const otherSum = carbs + fat;
      if (otherSum === 0) {
        c = Math.floor(remaining / 2);
        f = remaining - c;
      } else {
        c = Math.round((remaining * carbs) / otherSum);
        f = remaining - c;
      }
      break;
    }
    case 'carbs': {
      c = clamped;
      const remaining = 100 - c;
      const otherSum = protein + fat;
      if (otherSum === 0) {
        p = Math.floor(remaining / 2);
        f = remaining - p;
      } else {
        p = Math.round((remaining * protein) / otherSum);
        f = remaining - p;
      }
      break;
    }
    case 'fat': {
      f = clamped;
      const remaining = 100 - f;
      const otherSum = protein + carbs;
      if (otherSum === 0) {
        p = Math.floor(remaining / 2);
        c = remaining - p;
      } else {
        p = Math.round((remaining * protein) / otherSum);
        c = remaining - p;
      }
      break;
    }
  }

  return [p, c, f];
}
