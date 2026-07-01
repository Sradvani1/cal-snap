import { describe, expect, it } from 'vitest';
import { mapFirebaseAuthError } from '@/lib/auth/firebase-auth-errors';
import { copy } from '@/lib/copy';

function firebaseError(code: string): { code: string } {
  return { code };
}

describe('mapFirebaseAuthError', () => {
  it('maps login/signup error codes to copy strings', () => {
    expect(mapFirebaseAuthError(firebaseError('auth/invalid-credential'))).toBe(
      copy('auth.errors.invalidCredential'),
    );
    expect(mapFirebaseAuthError(firebaseError('auth/email-already-in-use'))).toBe(
      copy('auth.errors.emailAlreadyInUse'),
    );
    expect(mapFirebaseAuthError(firebaseError('auth/weak-password'))).toBe(
      copy('auth.errors.weakPassword'),
    );
    expect(mapFirebaseAuthError(firebaseError('auth/too-many-requests'))).toBe(
      copy('auth.errors.tooManyRequests'),
    );
    expect(mapFirebaseAuthError(firebaseError('auth/network-request-failed'))).toBe(
      copy('auth.errors.networkRequestFailed'),
    );
  });

  it('maps Google OAuth error codes to existing session copy', () => {
    expect(
      mapFirebaseAuthError(firebaseError('auth/account-exists-with-different-credential')),
    ).toBe(copy('auth.session.googleAccountExists'));
    expect(mapFirebaseAuthError(firebaseError('auth/unauthorized-domain'))).toBe(
      copy('auth.session.googleUnauthorizedDomain'),
    );
    expect(mapFirebaseAuthError(firebaseError('auth/popup-closed-by-user'))).toBe(
      copy('auth.session.googlePopupClosed'),
    );
  });

  it('uses generic fallback for unmapped Firebase codes', () => {
    const err = Object.assign(new Error('Firebase: Error (auth/invalid-email).'), {
      code: 'auth/invalid-email',
    });
    expect(mapFirebaseAuthError(err, 'auth.login.error')).toBe(copy('auth.login.error'));
    expect(mapFirebaseAuthError(err, 'auth.signup.error')).toBe(copy('auth.signup.error'));
  });

  it('falls back to Error message for non-Firebase errors', () => {
    expect(mapFirebaseAuthError(new Error('Something else'))).toBe('Something else');
  });
});
