import {
  calendarDaysBetween,
  dateFromLocalDateInput,
  isValidLocalDateInputValue,
} from '@/lib/utilities/date-input';

export const MAX_FUTURE_LOG_DAYS = 3;

export function isLoggableDate(date: Date, referenceDate: Date = new Date()): boolean {
  return calendarDaysBetween(referenceDate, date) <= MAX_FUTURE_LOG_DAYS;
}

export function parseLogDateParam(value: string | null, referenceDate: Date = new Date()): Date | undefined {
  if (!value || !isValidLocalDateInputValue(value)) return undefined;

  const date = dateFromLocalDateInput(value);
  return isLoggableDate(date, referenceDate) ? date : undefined;
}

export function localNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}
