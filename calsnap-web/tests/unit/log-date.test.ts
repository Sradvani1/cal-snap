import { describe, expect, it } from 'vitest';
import {
  isLoggableDate,
  localNoon,
  parseLogDateParam,
} from '@/lib/meal-log/log-date';

const referenceDate = new Date(2026, 7, 18, 9, 30, 0);

describe('log date', () => {
  it('accepts past dates and dates through three days ahead', () => {
    expect(parseLogDateParam('2026-08-17', referenceDate)).toEqual(
      new Date(2026, 7, 17, 12, 0, 0),
    );
    expect(parseLogDateParam('2026-08-21', referenceDate)).toEqual(
      new Date(2026, 7, 21, 12, 0, 0),
    );
  });

  it('rejects malformed, impossible, and too-far-future dates', () => {
    expect(parseLogDateParam('2026-02-30', referenceDate)).toBeUndefined();
    expect(parseLogDateParam('not-a-date', referenceDate)).toBeUndefined();
    expect(parseLogDateParam('2026-08-22', referenceDate)).toBeUndefined();
  });

  it('compares calendar days without depending on the reference time', () => {
    expect(isLoggableDate(new Date(2026, 7, 21, 23, 59, 59), referenceDate)).toBe(true);
    expect(isLoggableDate(new Date(2026, 7, 22, 0, 0, 0), referenceDate)).toBe(false);
  });

  it('normalizes a destination to local noon', () => {
    expect(localNoon(new Date(2026, 7, 18, 23, 59, 59))).toEqual(
      new Date(2026, 7, 18, 12, 0, 0),
    );
  });
});
