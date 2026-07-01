import { AppConstants } from '@/lib/constants';
import { copy } from '@/lib/copy';
import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { ageFromDateOfBirth } from '@/lib/nutrition/calculator';
import { validateGoalBelowCurrent } from '@/lib/nutrition/goal-pathway';
import {
  HEIGHT_RANGE_CM,
  normalizeHeightCm,
  normalizeWeightKg,
  validateHeightCm,
  validateWeightKg,
} from '@/lib/utilities/unit-formatters';

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
    validateWeightKg(draft.goalWeightKg) &&
    validateGoalBelowCurrent(draft.goalWeightKg, draft.weightKg)
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

  if (draft && !validateWeightKg(draft.goalWeightKg)) {
    return copy('onboarding.validation.weightRange');
  }
  if (draft && !validateGoalBelowCurrent(draft.goalWeightKg, draft.weightKg)) {
    return copy('onboarding.validation.goalBelowCurrent');
  }
  return copy('onboarding.validation.requiredFields');
}
