import { getFirebaseAuth } from '@/lib/firebase/client';
import { consumeGoogleRedirectResult } from '@/lib/auth/google-redirect';

/** Start OAuth redirect handling before React mounts (client only). */
export function bootstrapFirebaseAuthRedirect(): void {
  if (typeof window === 'undefined') {
    return;
  }
  void consumeGoogleRedirectResult(getFirebaseAuth());
}
