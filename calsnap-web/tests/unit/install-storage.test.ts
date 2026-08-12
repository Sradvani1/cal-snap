import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumePwaInstallEligible,
  dismissPwaInstall,
  isPwaInstallDismissed,
  markPwaInstallEligible,
  pwaInstallDismissedKey,
  pwaInstallEligibleKey,
} from '@/lib/pwa/install-storage';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('PWA install storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks an install as eligible and consumes it once', () => {
    markPwaInstallEligible('user-1');

    expect(consumePwaInstallEligible('user-1')).toBe(true);
    expect(consumePwaInstallEligible('user-1')).toBe(false);
  });

  it('stores and reads dismissal per user', () => {
    dismissPwaInstall('user-1');

    expect(isPwaInstallDismissed('user-1')).toBe(true);
    expect(isPwaInstallDismissed('user-2')).toBe(false);
    expect(pwaInstallEligibleKey('user-1')).toBe('pwaInstallEligible-user-1');
    expect(pwaInstallDismissedKey('user-1')).toBe('pwaInstallDismissed-user-1');
  });
});
