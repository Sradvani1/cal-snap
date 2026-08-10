/** Calendar-day helpers using the browser's local timezone. */

export {
  calendarDaysBetween as daysBetween,
  toLocalDayKey as localDayKey,
} from '@/lib/utilities/date-input';

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

export function nextLocalMidnight(date: Date): Date {
  const result = new Date(date);
  result.setHours(24, 0, 0, 0);
  return result;
}

export function msUntilNextLocalMidnight(date: Date): number {
  return Math.max(0, nextLocalMidnight(date).getTime() - date.getTime());
}
