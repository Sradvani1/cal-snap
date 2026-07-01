import { describe, expect, it, vi } from 'vitest';
import type { Auth, User } from 'firebase/auth';

vi.mock('@/lib/auth/wait-for-first-auth-event', () => ({
  waitForFirstAuthEvent: vi.fn(),
}));

import { waitForFirstAuthEvent } from '@/lib/auth/wait-for-first-auth-event';
import {
  resolveBootstrapAuthUser,
  resolveDeferredAuthUser,
  shouldClearSessionCookie,
} from '@/lib/auth/auth-redirect-state';

const mockedWait = vi.mocked(waitForFirstAuthEvent);

describe('auth-redirect-state', () => {
  it('prefers a deferred auth callback over currentUser', () => {
    const user = { uid: 'abc' } as User;
    expect(resolveDeferredAuthUser(null, user)).toBe(null);
    expect(resolveDeferredAuthUser(user, null)).toBe(user);
    expect(resolveDeferredAuthUser(undefined, user)).toBe(user);
  });

  it('clears session only when listener confirmed signed-out', () => {
    expect(shouldClearSessionCookie(false, null, null)).toBe(false);
    expect(shouldClearSessionCookie(true, null, null)).toBe(true);
    expect(shouldClearSessionCookie(true, null, undefined)).toBe(false);
    expect(shouldClearSessionCookie(true, { uid: 'x' } as User, null)).toBe(false);
  });

  it('resolveBootstrapAuthUser returns currentUser without waiting', async () => {
    const user = { uid: 'sync' } as User;
    const auth = { currentUser: user } as Auth;
    await expect(resolveBootstrapAuthUser(auth, undefined)).resolves.toBe(user);
    expect(mockedWait).not.toHaveBeenCalled();
  });

  it('resolveBootstrapAuthUser waits when listener has not fired', async () => {
    const user = { uid: 'waited' } as User;
    mockedWait.mockResolvedValueOnce(user);
    const auth = { currentUser: null } as Auth;
    await expect(resolveBootstrapAuthUser(auth, undefined)).resolves.toBe(user);
    expect(mockedWait).toHaveBeenCalledWith(auth);
  });
});
