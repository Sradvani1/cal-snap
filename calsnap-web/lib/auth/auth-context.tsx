'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { copy, type CopyKey } from '@/lib/copy';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useProfile } from '@/lib/queries/use-profile';

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

let redirectPromise: Promise<UserCredential | null> | undefined;

function consumeRedirect(auth: Auth) {
  redirectPromise ??= getRedirectResult(auth);
  return redirectPromise;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  onSignOut,
}: {
  children: ReactNode;
  onSignOut?: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    void consumeRedirect(auth).catch((error) => {
      setAuthError(mapFirebaseAuthError(error, 'auth.session.googleRedirectFailed'));
    });
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setAuthError(null);
      }
      setLoading(false);
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error, 'auth.login.error'));
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error, 'auth.signup.error'));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error, 'auth.session.googleRedirectFailed'));
    }
  }, []);

  const signOut = useCallback(async () => {
    onSignOut?.();
    setAuthError(null);
    await firebaseSignOut(getFirebaseAuth());
  }, [onSignOut]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, authError, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading: authLoading } = useAuth();
  const profile = useProfile(user?.uid);
  const router = useRouter();

  const profileBootstrapping = Boolean(user) && profile.isPending;
  const loading = authLoading || profileBootstrapping;

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile.isPending) {
      return;
    }
    if (profile.data?.extras.onboardingCompleted !== true) {
      router.replace('/onboarding');
    }
  }, [authLoading, user, profile.isPending, profile.data, router]);

  const ready =
    !authLoading &&
    user != null &&
    !profile.isPending &&
    profile.data?.extras.onboardingCompleted === true;

  return { user, loading, ready };
}
