import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeighIn } from '@/lib/models/weigh-in';
import { defaultReminderPrefs } from '@/lib/progress/reminder-prefs';
import { shouldShowWeighInReminderBanner } from '@/lib/progress/weigh-in-reminder';
import { snoozeWeighInUntilTomorrow } from '@/lib/progress/weigh-in-snooze';

const UID = 'test-user';
const NOW = new Date(2026, 5, 28, 12, 0, 0);

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function weighIn(daysAgo: number): WeighIn {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `wi-${daysAgo}`,
    userId: UID,
    date,
    weightKg: 80,
  };
}

function profileCreatedAt(daysAgo: number): Date {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

describe('shouldShowWeighInReminderBanner', () => {
  it('returns false when reminders are disabled', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: { ...defaultReminderPrefs(), weighInReminderEnabled: false },
        latestWeighIn: weighIn(8),
        profileCreatedAt: profileCreatedAt(30),
        uid: UID,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns false when snoozed', () => {
    const uid = 'snoozed-user';
    snoozeWeighInUntilTomorrow(uid, NOW);

    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: weighIn(8),
        profileCreatedAt: profileCreatedAt(30),
        uid,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns false when last weigh-in was 3 days ago', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: weighIn(3),
        profileCreatedAt: profileCreatedAt(30),
        uid: UID,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true when last weigh-in was 8 days ago', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: weighIn(8),
        profileCreatedAt: profileCreatedAt(30),
        uid: UID,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('returns false when no weigh-in and profile is 5 days old', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: undefined,
        profileCreatedAt: profileCreatedAt(5),
        uid: UID,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('returns true when no weigh-in and profile is 8 days old', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: undefined,
        profileCreatedAt: profileCreatedAt(8),
        uid: UID,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('returns false after a fresh weigh-in', () => {
    expect(
      shouldShowWeighInReminderBanner({
        prefs: defaultReminderPrefs(),
        latestWeighIn: weighIn(0),
        profileCreatedAt: profileCreatedAt(30),
        uid: UID,
        now: NOW,
      }),
    ).toBe(false);
  });
});
