import { daysBetween, localDayKey, startOfLocalDay } from '@/lib/dashboard/date-window';
import type { MacroSplit } from '@/lib/models/macro-split';

export const ANALYTICS_MAX_CUSTOM_SPAN_DAYS = 365;

export type AnalyticsDateRange =
  | { kind: 'days'; count: number }
  | { kind: 'custom'; start: Date; end: Date };

export const AnalyticsDateRange = {
  days(count: number): AnalyticsDateRange {
    return { kind: 'days', count };
  },

  custom(start: Date, end: Date): AnalyticsDateRange {
    return { kind: 'custom', start, end };
  },

  maxCustomSpanDays: ANALYTICS_MAX_CUSTOM_SPAN_DAYS,

  resolvedEnd(range: AnalyticsDateRange, reference: Date = new Date()): Date {
    const today = startOfLocalDay(reference);
    if (range.kind === 'days') {
      return today;
    }
    const endDay = startOfLocalDay(range.end);
    return endDay.getTime() <= today.getTime() ? endDay : today;
  },

  resolvedStart(range: AnalyticsDateRange, reference: Date = new Date()): Date {
    const end = AnalyticsDateRange.resolvedEnd(range, reference);
    if (range.kind === 'days') {
      const start = new Date(end);
      start.setDate(start.getDate() - (range.count - 1));
      return startOfLocalDay(start);
    }
    const normalizedStart = startOfLocalDay(range.start);
    const normalizedEnd = end;
    if (normalizedStart.getTime() <= normalizedEnd.getTime()) {
      return normalizedStart;
    }
    return normalizedEnd;
  },

  displayLabel(range: AnalyticsDateRange): string {
    if (range.kind === 'days') {
      if (range.count === 7) return '7D';
      if (range.count === 30) return '30D';
      if (range.count === 90) return '90D';
      return `${range.count} days`;
    }
    return 'Custom';
  },
};

export type AnalyticsTimeframePreset = '7D' | '30D' | '90D' | 'custom';

export const ANALYTICS_TIMEFRAME_PRESETS: AnalyticsTimeframePreset[] = [
  '7D',
  '30D',
  '90D',
  'custom',
];

export function presetToDateRange(preset: AnalyticsTimeframePreset): AnalyticsDateRange {
  switch (preset) {
    case '7D':
      return AnalyticsDateRange.days(7);
    case '30D':
      return AnalyticsDateRange.days(30);
    case '90D':
      return AnalyticsDateRange.days(90);
    case 'custom':
      return AnalyticsDateRange.days(7);
  }
}

export function analyticsRangeKey(
  range: AnalyticsDateRange,
  reference: Date = new Date(),
): string {
  if (range.kind === 'days') {
    if (range.count === 7) return '7d';
    if (range.count === 30) return '30d';
    if (range.count === 90) return '90d';
    return `${range.count}d`;
  }
  const start = AnalyticsDateRange.resolvedStart(range, reference);
  const end = AnalyticsDateRange.resolvedEnd(range, reference);
  return `custom:${localDayKey(start)}:${localDayKey(end)}`;
}

export function normalizeCustomRange(
  start: Date,
  end: Date,
  reference: Date = new Date(),
): AnalyticsDateRange {
  let startDay = startOfLocalDay(start);
  let endDay = startOfLocalDay(end);
  const today = startOfLocalDay(reference);

  if (endDay.getTime() > today.getTime()) {
    endDay = today;
  }

  if (startDay.getTime() > endDay.getTime()) {
    [startDay, endDay] = [endDay, startDay];
  }

  const spanDays = daysBetween(startDay, endDay) + 1;
  if (spanDays > ANALYTICS_MAX_CUSTOM_SPAN_DAYS) {
    const trimmedStart = new Date(endDay);
    trimmedStart.setDate(trimmedStart.getDate() - (ANALYTICS_MAX_CUSTOM_SPAN_DAYS - 1));
    startDay = startOfLocalDay(trimmedStart);
  }

  return AnalyticsDateRange.custom(startDay, endDay);
}

export interface DailyNutritionSummary {
  date: Date;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export enum Weekday {
  sunday = 1,
  monday = 2,
  tuesday = 3,
  wednesday = 4,
  thursday = 5,
  friday = 6,
  saturday = 7,
}

export function toWeekday(date: Date): Weekday | null {
  const jsDay = date.getDay();
  const rawValue = jsDay + 1;
  if (rawValue >= Weekday.sunday && rawValue <= Weekday.saturday) {
    return rawValue as Weekday;
  }
  return null;
}

export function weekdayShortLabel(weekday: Weekday): string {
  switch (weekday) {
    case Weekday.sunday:
      return 'Sun';
    case Weekday.monday:
      return 'Mon';
    case Weekday.tuesday:
      return 'Tue';
    case Weekday.wednesday:
      return 'Wed';
    case Weekday.thursday:
      return 'Thu';
    case Weekday.friday:
      return 'Fri';
    case Weekday.saturday:
      return 'Sat';
  }
}

export function isWeekendWeekday(weekday: Weekday): boolean {
  return weekday === Weekday.saturday || weekday === Weekday.sunday;
}

export enum TimeOfDayBucket {
  morning = 'morning',
  midday = 'midday',
  evening = 'evening',
  night = 'night',
}

export const TIME_OF_DAY_BUCKETS: TimeOfDayBucket[] = [
  TimeOfDayBucket.morning,
  TimeOfDayBucket.midday,
  TimeOfDayBucket.evening,
  TimeOfDayBucket.night,
];

export function timeOfDayBucketForHour(hour: number): TimeOfDayBucket {
  if (hour >= 5 && hour < 11) return TimeOfDayBucket.morning;
  if (hour >= 11 && hour < 15) return TimeOfDayBucket.midday;
  if (hour >= 15 && hour < 21) return TimeOfDayBucket.evening;
  return TimeOfDayBucket.night;
}

export function timeOfDayDisplayLabel(bucket: TimeOfDayBucket): string {
  switch (bucket) {
    case TimeOfDayBucket.morning:
      return 'Morning';
    case TimeOfDayBucket.midday:
      return 'Midday';
    case TimeOfDayBucket.evening:
      return 'Evening';
    case TimeOfDayBucket.night:
      return 'Night';
  }
}

export interface TopFoodEntry {
  name: string;
  count: number;
  avgCalories: number;
}

export interface AnalyticsInsightPayload {
  timeframeLabel: string;
  loggedDayCount: number;
  averageDailyCalories: number;
  calorieTarget: number;
  adherencePercent: number;
  actualMacroSplit: MacroSplit;
  targetMacroSplit: MacroSplit;
  averageDailyFiberG: number;
  fiberTargetG: number;
  weekendAverageCalories: number | null;
  weekdayAverageCalories: number | null;
  topFoods: TopFoodEntry[];
  weightChangeKg: number | null;
}

export function emptyWeekdayBreakdown(): Record<Weekday, number> {
  return {
    [Weekday.sunday]: 0,
    [Weekday.monday]: 0,
    [Weekday.tuesday]: 0,
    [Weekday.wednesday]: 0,
    [Weekday.thursday]: 0,
    [Weekday.friday]: 0,
    [Weekday.saturday]: 0,
  };
}

export function emptyTimeOfDayBreakdown(): Record<TimeOfDayBucket, number> {
  return {
    [TimeOfDayBucket.morning]: 0,
    [TimeOfDayBucket.midday]: 0,
    [TimeOfDayBucket.evening]: 0,
    [TimeOfDayBucket.night]: 0,
  };
}
