import { describe, expect, it } from 'vitest';
import { appUsageSessionKey } from '@/lib/usage/use-app-usage';

describe('appUsageSessionKey', () => {
  it('scopes the app-open marker to the authenticated account', () => {
    expect(appUsageSessionKey('alice')).toBe('calsnap_usage_opened_alice');
    expect(appUsageSessionKey('bob')).toBe('calsnap_usage_opened_bob');
  });
});
