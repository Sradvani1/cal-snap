import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import { validateDateOfBirth } from '@/lib/onboarding/validation';
import { validateGoalBelowCurrent } from '@/lib/nutrition/goal-pathway';
import { copy } from '@/lib/copy';
import { macroPercentsAreValid } from '@/lib/services/profile-update-service';
import {
  validateHeightCm,
  validateWeightKg,
} from '@/lib/utilities/unit-formatters';

export function validateCurrentWeightKg(weightKg: number): boolean {
  return validateWeightKg(weightKg);
}

export function canSaveSettings(
  draft: ProfileDraft,
  macroPcts: { protein: number; carbs: number; fat: number },
  currentWeightKg: number,
): boolean {
  return (
    validateDateOfBirth(draft.dateOfBirth) &&
    validateHeightCm(draft.heightCm) &&
    validateCurrentWeightKg(currentWeightKg) &&
    validateWeightKg(draft.goalWeightKg) &&
    validateGoalBelowCurrent(draft.goalWeightKg, currentWeightKg) &&
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
  if (!validateHeightCm(draft.heightCm)) {
    return copy('settings.validation.heightRange');
  }
  if (!validateCurrentWeightKg(currentWeightKg)) {
    return copy('settings.validation.weightRange');
  }
  if (!validateWeightKg(draft.goalWeightKg)) {
    return copy('settings.validation.goalWeightRange');
  }
  if (!validateGoalBelowCurrent(draft.goalWeightKg, currentWeightKg)) {
    return copy('settings.validation.goalBelowCurrent');
  }
  if (!macroPercentsAreValid(macroPcts.protein, macroPcts.carbs, macroPcts.fat)) {
    return copy('settings.validation.macroSum');
  }
  return null;
}
