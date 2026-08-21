import { describe, expect, it } from 'vitest';
import {
  buildUsageSummary,
  canRecordUsageEvent,
  MAX_EVENTS_PER_USER_PER_DAY,
} from '@/lib/usage/server';

describe('usage aggregation', () => {
  it('merges shards into daily aggregates and includes zero-activity days', () => {
    const summary = buildUsageSummary(
      [
        {
          date: '2026-08-19',
          activeUsers: 2,
          eventCounts: { app_opened: 2, meal_saved: 3 },
        },
        {
          date: '2026-08-19',
          activeUsers: 1,
          eventCounts: { app_opened: 1 },
          'eventCounts.scan_requested': 4,
        },
        {
          date: '2026-08-17',
          activeUsers: 99,
          eventCounts: { meal_saved: 99 },
        },
      ],
      2,
      new Date('2026-08-20T12:00:00Z'),
    );

    expect(summary.days).toEqual([
      {
        date: '2026-08-19',
        activeUsers: 3,
        eventCounts: { app_opened: 3, meal_saved: 3, scan_requested: 4 },
      },
      { date: '2026-08-20', activeUsers: 0, eventCounts: {} },
    ]);
    expect(summary.totals).toEqual({
      activeUsers: 3,
      eventCounts: { app_opened: 3, meal_saved: 3, scan_requested: 4 },
    });
  });

  it('caps a pseudonymous account at the configured daily event limit', () => {
    expect(canRecordUsageEvent(MAX_EVENTS_PER_USER_PER_DAY - 1)).toBe(true);
    expect(canRecordUsageEvent(MAX_EVENTS_PER_USER_PER_DAY)).toBe(false);
  });
});
