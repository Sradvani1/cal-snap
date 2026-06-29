import { describe, expect, it } from 'vitest';
import {
  resolveDeferredAuthUser,
  shouldClearSessionCookie,
} from '@/lib/auth/auth-redirect-state';

describe('auth-redirect-state', () => {
  it('prefers a deferred auth callback over currentUser', () => {
    const user = { uid: 'abc' } as { uid: string };
    expect(resolveDeferredAuthUser(null, user as never)).toBe(null);
    expect(resolveDeferredAuthUser(user as never, null)).toBe(user);
    expect(resolveDeferredAuthUser(undefined, user as never)).toBe(user);
  });

  it('clears session only after redirect handling settles with no user', () => {
    expect(shouldClearSessionCookie(false, null)).toBe(false);
    expect(shouldClearSessionCookie(true, null)).toBe(true);
    expect(shouldClearSessionCookie(true, { uid: 'x' } as never)).toBe(false);
  });
});
