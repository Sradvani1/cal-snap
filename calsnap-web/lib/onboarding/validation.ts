import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { ageFromDateOfBirth } from '@/lib/nutrition/calculator';
import {
  HEIGHT_RANGE_CM,
  normalizeHeightCm,
  normalizeWeightKg,
  validateHeightCm,
  validateWeightKg,
} from '@/lib/utilities/unit-formatters';

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function validateDateOfBirth(
  date: Date,
  referenceDate: Date = new Date(),
): boolean {
  const age = ageFromDateOfBirth(date, referenceDate);
  return (
    age >= AppConstants.Onboarding.minAgeYears &&
    age <= AppConstants.Onboarding.maxAgeYears
  );
}

export function validateGoalTargetDate(
  date: Date,
  referenceDate: Date = new Date(),
): boolean {
  const start = startOfDay(referenceDate);
  const target = startOfDay(date);
  const minDate = new Date(start);
  minDate.setDate(minDate.getDate() + AppConstants.Onboarding.minGoalDaysFromToday);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + AppConstants.Onboarding.maxGoalDaysFromToday);
  return target >= minDate && target <= maxDate;
}

export function normalizeProfileSetupDraft(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    heightCm: normalizeHeightCm(draft.heightCm),
    weightKg: normalizeWeightKg(draft.weightKg, draft.useLbsWeight),
    useLbsGoalWeight: draft.useLbsWeight,
  };
}

export function normalizeGoalSetupDraft(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    goalWeightKg: normalizeWeightKg(draft.goalWeightKg, draft.useLbsGoalWeight),
  };
}

export function canAdvanceProfileSetup(draft: ProfileDraft): boolean {
  return (
    validateDateOfBirth(draft.dateOfBirth) &&
    validateHeightCm(draft.heightCm) &&
    validateWeightKg(draft.weightKg)
  );
}

export function canAdvanceGoalSetup(draft: ProfileDraft): boolean {
  return (
    validateGoalTargetDate(draft.goalTargetDate) &&
    validateWeightKg(draft.goalWeightKg)
  );
}

export function validationMessageForStep(
  step: 'profileSetup' | 'goalSetup',
  draft?: ProfileDraft,
): string {
  if (step === 'profileSetup') {
    if (draft && !validateDateOfBirth(draft.dateOfBirth)) {
      return copy('onboarding.validation.ageRange', {
        min: AppConstants.Onboarding.minAgeYears,
        max: AppConstants.Onboarding.maxAgeYears,
      });
    }
    if (draft && !validateHeightCm(draft.heightCm)) {
      return copy('onboarding.validation.heightRange', {
        min: HEIGHT_RANGE_CM.min,
        max: HEIGHT_RANGE_CM.max,
      });
    }
    if (draft && !validateWeightKg(draft.weightKg)) {
      return copy('onboarding.validation.weightRange');
    }
    return copy('onboarding.validation.requiredFields');
  }

  if (draft && !validateGoalTargetDate(draft.goalTargetDate)) {
    return copy('onboarding.validation.goalDateRange', {
      min: AppConstants.Onboarding.minGoalDaysFromToday,
      max: AppConstants.Onboarding.maxGoalDaysFromToday,
    });
  }
  if (draft && !validateWeightKg(draft.goalWeightKg)) {
    return copy('onboarding.validation.weightRange');
  }
  return copy('onboarding.validation.requiredFields');
}
