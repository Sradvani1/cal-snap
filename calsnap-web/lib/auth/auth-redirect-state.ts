import type { Auth, User } from 'firebase/auth';
import { waitForFirstAuthEvent } from '@/lib/auth/wait-for-first-auth-event';

/** `undefined` means onAuthStateChanged has not fired yet. */
export type PendingAuthUser = User | null | undefined;

export function resolveDeferredAuthUser(
  pending: PendingAuthUser,
  currentUser: User | null,
): User | null {
  if (pending !== undefined) {
    return pending;
  }
  return currentUser;
}

export function shouldClearSessionCookie(
  redirectSettled: boolean,
  user: User | null,
  pendingAuthUser: PendingAuthUser,
): boolean {
  // `pendingAuthUser === undefined` means onAuthStateChanged has not fired yet — do not
  // clear the httpOnly cookie during that bootstrap window (Firebase may still restore).
  return redirectSettled && user === null && pendingAuthUser === null;
}

/** True once onAuthStateChanged has delivered an initial value. */
export function hasAuthListenerFired(pendingAuthUser: PendingAuthUser): boolean {
  return pendingAuthUser !== undefined;
}

/** Wait for Firebase persistence when the listener has not fired yet. */
export async function resolveBootstrapAuthUser(
  auth: Auth,
  pendingAuthUser: PendingAuthUser,
): Promise<User | null> {
  const resolved = resolveDeferredAuthUser(pendingAuthUser, auth.currentUser);
  if (pendingAuthUser === undefined && auth.currentUser === null) {
    return waitForFirstAuthEvent(auth);
  }
  return resolved;
}
