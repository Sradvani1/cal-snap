import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  validateDateOfBirth,
  validateGoalTargetDate,
} from '@/lib/onboarding/validation';
import { copy } from '@/lib/copy';
import { macroPercentsAreValid } from '@/lib/services/profile-update-service';
import { WEIGHT_RANGE_KG } from '@/lib/utilities/unit-formatters';

export function validateCurrentWeightKg(weightKg: number): boolean {
  return (
    Number.isFinite(weightKg) &&
    weightKg > 0 &&
    weightKg >= WEIGHT_RANGE_KG.min &&
    weightKg <= WEIGHT_RANGE_KG.max
  );
}

export function canSaveSettings(
  draft: ProfileDraft,
  macroPcts: { protein: number; carbs: number; fat: number },
  currentWeightKg: number,
): boolean {
  return (
    validateDateOfBirth(draft.dateOfBirth) &&
    validateGoalTargetDate(draft.goalTargetDate) &&
    validateCurrentWeightKg(currentWeightKg) &&
    macroPercentsAreValid(macroPcts.protein, macroPcts.carbs, macroPcts.fat)
  );
}

export function settingsValidationMessage(
  draft: ProfileDraft,
  macroPcts: { protein: number; carbs: number; fat: number },
  currentWeightKg: number,
): string | null {
  if (!validateDateOfBirth(draft.dateOfBirth)) {
    return copy('settings.validation.ageRange');
  }
  if (!validateGoalTargetDate(draft.goalTargetDate)) {
    return copy('settings.validation.goalDateRange');
  }
  if (!validateCurrentWeightKg(currentWeightKg)) {
    return copy('settings.validation.weightRange');
  }
  if (!macroPercentsAreValid(macroPcts.protein, macroPcts.carbs, macroPcts.fat)) {
    return copy('settings.validation.macroSum');
  }
  return null;
}
