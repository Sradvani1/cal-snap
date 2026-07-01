import { copy, type CopyKey } from '@/lib/copy';

type AuthErrorFallback = Extract<
  CopyKey,
  'auth.login.error' | 'auth.signup.error' | 'auth.session.googleRedirectFailed'
>;

export function mapFirebaseAuthError(
  error: unknown,
  fallback: AuthErrorFallback = 'auth.session.googleRedirectFailed',
): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    switch (code) {
      case 'auth/invalid-credential':
        return copy('auth.errors.invalidCredential');
      case 'auth/email-already-in-use':
        return copy('auth.errors.emailAlreadyInUse');
      case 'auth/weak-password':
        return copy('auth.errors.weakPassword');
      case 'auth/too-many-requests':
        return copy('auth.errors.tooManyRequests');
      case 'auth/network-request-failed':
        return copy('auth.errors.networkRequestFailed');
      case 'auth/account-exists-with-different-credential':
        return copy('auth.session.googleAccountExists');
      case 'auth/unauthorized-domain':
        return copy('auth.session.googleUnauthorizedDomain');
      case 'auth/popup-closed-by-user':
        return copy('auth.session.googlePopupClosed');
      default:
        return copy(fallback);
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return copy(fallback);
}
