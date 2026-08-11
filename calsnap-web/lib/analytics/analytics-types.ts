import { daysBetween, localDayKey, startOfLocalDay } from '@/lib/dashboard/date-window';

const ANALYTICS_MAX_CUSTOM_SPAN_DAYS = 365;

export const ANALYTICS_MIN_INSIGHT_LOGGED_DAYS = 3;

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

export function analyticsWindow(
  range: AnalyticsDateRange,
  reference: Date = new Date(),
): { start: Date; end: Date } {
  let start = AnalyticsDateRange.resolvedStart(range, reference);
  let end = AnalyticsDateRange.resolvedEnd(range, reference);
  const today = startOfLocalDay(reference);

  if (end.getTime() >= today.getTime()) {
    end = new Date(end);
    end.setDate(end.getDate() - 1);
    if (range.kind === 'days') {
      const newStart = new Date(end);
      newStart.setDate(newStart.getDate() - (range.count - 1));
      start = startOfLocalDay(newStart);
    }
  }

  return { start, end };
}

export interface DailyNutritionSummary {
  date: Date;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  fiberG: number;
}

export interface TopFoodEntry {
  name: string;
  count: number;
  avgCalories: number;
}
