import type { ProfileDraft } from '@/lib/onboarding/profile-draft';
import {
  validateDateOfBirth,
  validateGoalTargetDate,
} from '@/lib/onboarding/validation';
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
    return 'Age must be between 18 and 90 years.';
  }
  if (!validateGoalTargetDate(draft.goalTargetDate)) {
    return 'Goal date must be 14–730 days from today.';
  }
  if (!validateCurrentWeightKg(currentWeightKg)) {
    return 'Weight must be within a valid range.';
  }
  if (!macroPercentsAreValid(macroPcts.protein, macroPcts.carbs, macroPcts.fat)) {
    return 'Macro percentages must sum to 100%.';
  }
  return null;
}
