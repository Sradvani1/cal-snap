import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  localDayKey,
  msUntilNextLocalMidnight,
  nextLocalMidnight,
} from '@/lib/dashboard/date-window';

const springDstObserved =
  new Date(2026, 2, 7, 12).getTimezoneOffset() !==
  new Date(2026, 2, 8, 12).getTimezoneOffset();
const fallDstObserved =
  new Date(2026, 9, 31, 12).getTimezoneOffset() !==
  new Date(2026, 10, 1, 12).getTimezoneOffset();

describe('calendar day helpers', () => {
  it('counts ordinary calendar days', () => {
    expect(daysBetween(new Date(2026, 6, 1, 23), new Date(2026, 6, 3, 1))).toBe(2);
    expect(localDayKey(new Date(2026, 6, 1, 23))).toBe('2026-07-01');
  });

  it.skipIf(!springDstObserved)('counts days across spring-forward', () => {
    expect(daysBetween(new Date(2026, 2, 7), new Date(2026, 2, 9))).toBe(2);
  });

  it.skipIf(!fallDstObserved)('counts days across fall-back', () => {
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 10, 2))).toBe(2);
  });
});

describe('nextLocalMidnight', () => {
  it('returns the next calendar day at 00:00', () => {
    const now = new Date(2026, 6, 31, 14, 30, 15);
    const expected = new Date(2026, 7, 1, 0, 0, 0, 0);
    expect(nextLocalMidnight(now).getTime()).toBe(expected.getTime());
  });

  it('rolls forward from a midnight reference', () => {
    const now = new Date(2026, 6, 31, 0, 0, 0, 0);
    const expected = new Date(2026, 7, 1, 0, 0, 0, 0);
    expect(nextLocalMidnight(now).getTime()).toBe(expected.getTime());
  });

  it('crosses the year boundary', () => {
    const now = new Date(2026, 11, 31, 23, 30, 0);
    const expected = new Date(2027, 0, 1, 0, 0, 0, 0);
    expect(nextLocalMidnight(now).getTime()).toBe(expected.getTime());
  });

  it('rolls forward across a 23-hour DST day', () => {
    const now = new Date(2026, 2, 8, 12, 0, 0);
    const expected = new Date(2026, 2, 9, 0, 0, 0, 0);
    expect(nextLocalMidnight(now).getTime()).toBe(expected.getTime());
  });

  it('rolls forward across a 25-hour DST day', () => {
    const now = new Date(2026, 10, 1, 12, 0, 0);
    const expected = new Date(2026, 10, 2, 0, 0, 0, 0);
    expect(nextLocalMidnight(now).getTime()).toBe(expected.getTime());
  });
});

describe('msUntilNextLocalMidnight', () => {
  it('equals the ms gap to the next midnight and is positive', () => {
    const now = new Date(2026, 6, 31, 14, 30, 15);
    const gap = msUntilNextLocalMidnight(now);
    expect(gap).toBe(nextLocalMidnight(now).getTime() - now.getTime());
    expect(gap).toBeGreaterThan(0);
  });

  it('is the ms gap between the two local day starts', () => {
    const now = new Date(2026, 6, 31, 0, 0, 0, 0);
    const expectedGap = new Date(2026, 7, 1, 0, 0, 0, 0).getTime() - now.getTime();
    expect(msUntilNextLocalMidnight(now)).toBe(expectedGap);
  });
});
