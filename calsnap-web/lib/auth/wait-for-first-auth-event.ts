import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';

/** Resolves when Firebase delivers the first persisted auth state for this page load. */
export function waitForFirstAuthEvent(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
