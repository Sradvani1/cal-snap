/** Calendar-day helpers using the browser's local timezone. */

export function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfLocalDayExclusive(date: Date): Date {
  const start = startOfLocalDay(date);
  const result = new Date(start);
  result.setDate(result.getDate() + 1);
  return result;
}

export function calendarDayRange(day: Date): { start: Date; end: Date } {
  const start = startOfLocalDay(day);
  return { start, end: endOfLocalDayExclusive(day) };
}

export function localDayKey(day: Date): string {
  const start = startOfLocalDay(day);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const date = String(start.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function lastNDaysWindow(
  dayCount: number,
  referenceDate: Date = new Date(),
): { start: Date; end: Date } {
  const end = endOfLocalDayExclusive(referenceDate);
  const start = startOfLocalDay(referenceDate);
  start.setDate(start.getDate() - (dayCount - 1));
  return { start, end };
}

export function daysBetween(start: Date, end: Date): number {
  const startDay = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  return Math.floor((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
}
