import type { User } from 'firebase/auth';

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
): boolean {
  return redirectSettled && user === null;
}
