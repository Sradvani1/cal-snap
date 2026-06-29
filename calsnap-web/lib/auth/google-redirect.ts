import { getRedirectResult, type Auth, type UserCredential } from 'firebase/auth';

// React Strict Mode mounts AuthProvider twice in production. Each call to
// getRedirectResult() consumes the pending OAuth redirect, so the second mount
// sees null and clears the session cookie. Share one promise per page load.
let redirectResultPromise: Promise<UserCredential | null> | undefined;

export function consumeGoogleRedirectResult(auth: Auth): Promise<UserCredential | null> {
  redirectResultPromise ??= getRedirectResult(auth);
  return redirectResultPromise;
}
