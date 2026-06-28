import { AppConstants } from '@/lib/constants';
import { ageFromDateOfBirth } from '@/lib/nutrition/calculator';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
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

export function validationMessageForStep(
  step: 'profileSetup' | 'goalSetup',
): string {
  if (step === 'profileSetup') {
    return `Age must be between ${AppConstants.Onboarding.minAgeYears} and ${AppConstants.Onboarding.maxAgeYears} years.`;
  }
  return `Goal date must be ${AppConstants.Onboarding.minGoalDaysFromToday}–${AppConstants.Onboarding.maxGoalDaysFromToday} days from today.`;
}
