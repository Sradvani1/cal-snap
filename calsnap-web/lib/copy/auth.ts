export const authCopy = {
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Welcome back to CalSnap',
  'auth.login.submit': 'Sign in',
  'auth.login.submitting': 'Signing in…',
  'auth.login.google': 'Continue with Google',
  'auth.login.noAccount': 'No account?',
  'auth.login.signUpLink': 'Sign up',
  'auth.login.error': 'Sign in failed',
  'auth.login.googleError': 'Google sign in failed',
  'auth.signup.title': 'Create account',
  'auth.signup.subtitle': 'Start your CalSnap journey',
  'auth.signup.submit': 'Sign up',
  'auth.signup.submitting': 'Creating account…',
  'auth.signup.google': 'Continue with Google',
  'auth.signup.hasAccount': 'Already have an account?',
  'auth.signup.signInLink': 'Sign in',
  'auth.signup.error': 'Sign up failed',
  'auth.signup.googleError': 'Google sign up failed',
  'auth.session.establishFailed': 'Failed to establish session',
  'auth.session.refreshFailed': 'Failed to refresh session',
} as const;

export type AuthCopyKey = keyof typeof authCopy;
