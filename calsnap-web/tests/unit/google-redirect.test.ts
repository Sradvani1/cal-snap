import { describe, expect, it, vi } from 'vitest';
import type { Auth, UserCredential } from 'firebase/auth';

const getRedirectResult = vi.fn<() => Promise<UserCredential | null>>();

vi.mock('firebase/auth', () => ({
  getRedirectResult,
}));

describe('consumeGoogleRedirectResult', () => {
  it('reuses one getRedirectResult promise per page load', async () => {
    vi.resetModules();
    getRedirectResult.mockReset();
    getRedirectResult.mockResolvedValue(null);

    const { consumeGoogleRedirectResult } = await import('@/lib/auth/google-redirect');
    const auth = {} as Auth;

    const first = consumeGoogleRedirectResult(auth);
    const second = consumeGoogleRedirectResult(auth);

    expect(first).toBe(second);
    await first;
    expect(getRedirectResult).toHaveBeenCalledTimes(1);
  });
});
