import { AppConstants } from '@/lib/constants';

const COMPLETE_DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Format a Date for `<input type="date">` using local calendar fields. */
export function toLocalDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a local calendar day as `YYYY-MM-DD`. */
export function toLocalDayKey(date: Date): string {
  return toLocalDateInputValue(date);
}

function utcDayNumber(date: Date): number {
  return Math.round(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  );
}

/** Count local calendar days between two dates without being affected by DST. */
export function calendarDaysBetween(start: Date, end: Date): number {
  return utcDayNumber(end) - utcDayNumber(start);
}

/** Parse `<input type="date">` value as local noon to avoid DST edge cases. */
export function dateFromLocalDateInput(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** True when the value is a complete `YYYY-MM-DD` string from a date input. */
export function isCompleteDateInputValue(value: string): boolean {
  return COMPLETE_DATE_INPUT_PATTERN.test(value);
}

/** True when a complete date input value maps back to the same local calendar date. */
export function isValidLocalDateInputValue(value: string): boolean {
  if (!isCompleteDateInputValue(value)) {
    return false;
  }
  return toLocalDateInputValue(dateFromLocalDateInput(value)) === value;
}

/** Allowed `<input type="date">` bounds for date of birth (16–90 years). */
export function dateOfBirthInputBounds(referenceDate: Date = new Date()): {
  min: string;
  max: string;
} {
  const maxDate = new Date(referenceDate);
  maxDate.setFullYear(maxDate.getFullYear() - AppConstants.Onboarding.minAgeYears);

  const minDate = new Date(referenceDate);
  minDate.setFullYear(minDate.getFullYear() - AppConstants.Onboarding.maxAgeYears);

  return {
    min: toLocalDateInputValue(minDate),
    max: toLocalDateInputValue(maxDate),
  };
}
