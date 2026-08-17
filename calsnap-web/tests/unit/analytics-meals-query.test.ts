import { describe, expect, it } from 'vitest';
import { AnalyticsDateRange } from '@/lib/analytics/analytics-types';
import { analyticsMealsQueryOptions } from '@/lib/queries/use-analytics-meals';

describe('analyticsMealsQueryOptions', () => {
  it('produces distinct keys per preset range', () => {
    const reference = new Date('2026-08-16T10:00:00');
    const seven = analyticsMealsQueryOptions('user-1', AnalyticsDateRange.days(7), reference);
    const thirty = analyticsMealsQueryOptions('user-1', AnalyticsDateRange.days(30), reference);
    const ninety = analyticsMealsQueryOptions('user-1', AnalyticsDateRange.days(90), reference);

    expect(seven.queryKey).not.toEqual(thirty.queryKey);
    expect(thirty.queryKey).not.toEqual(ninety.queryKey);
    expect(seven.queryKey).not.toEqual(ninety.queryKey);
  });

  it('is day-stable: same local day yields the same key', () => {
    const morning = analyticsMealsQueryOptions(
      'user-1',
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T08:00:00'),
    );
    const evening = analyticsMealsQueryOptions(
      'user-1',
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T22:30:00'),
    );

    expect(evening.queryKey).toEqual(morning.queryKey);
  });

  it('rolls the key over at midnight', () => {
    const today = analyticsMealsQueryOptions(
      'user-1',
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T23:59:00'),
    );
    const tomorrow = analyticsMealsQueryOptions(
      'user-1',
      AnalyticsDateRange.days(30),
      new Date('2026-08-17T00:00:00'),
    );

    expect(tomorrow.queryKey).not.toEqual(today.queryKey);
  });

  it('embeds the resolved day boundaries in the key', () => {
    const rangeStart = AnalyticsDateRange.resolvedStart(
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T10:00:00'),
    );
    const rangeEnd = AnalyticsDateRange.resolvedEnd(
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T10:00:00'),
    );

    const { queryKey } = analyticsMealsQueryOptions(
      'user-1',
      AnalyticsDateRange.days(30),
      new Date('2026-08-16T10:00:00'),
    );

    expect(queryKey).toContain(rangeStart.getTime());
    expect(queryKey).toContain(rangeEnd.getTime());
  });
});