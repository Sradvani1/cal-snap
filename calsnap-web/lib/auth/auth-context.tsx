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
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { consumeGoogleRedirectResult } from '@/lib/auth/google-redirect';
import { shouldUseGoogleRedirect } from '@/lib/auth/google-sign-in-strategy';
import { navigateAfterAuth } from '@/lib/auth/navigate-after-auth';
import { copy } from '@/lib/copy';
import { getFirebaseAuth } from '@/lib/firebase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    if (code === 'auth/account-exists-with-different-credential') {
      return copy('auth.session.googleAccountExists');
    }
    if (code === 'auth/unauthorized-domain') {
      return copy('auth.session.googleUnauthorizedDomain');
    }
    if (code === 'auth/popup-closed-by-user') {
      return copy('auth.session.googlePopupClosed');
    }
  }
  return error instanceof Error ? error.message : copy('auth.session.googleRedirectFailed');
}

async function clearSessionCookie(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
}

async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? copy('auth.session.establishFailed'));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let cancelled = false;
    let initialAuthStateResolved = false;

    async function initAuth() {
      try {
        const redirectResult = await consumeGoogleRedirectResult(auth);
        if (redirectResult?.user) {
          await establishSession(redirectResult.user);
          if (!cancelled) {
            setSessionError(null);
            await navigateAfterAuth(redirectResult.user);
            return;
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(firebaseAuthErrorMessage(error));
        }
      }

      const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
        if (cancelled) {
          return;
        }
        setUser(nextUser);
        if (nextUser) {
          try {
            await establishSession(nextUser);
            setSessionError(null);
          } catch (err) {
            setSessionError(
              err instanceof Error ? err.message : copy('auth.session.establishFailed'),
            );
          }
        } else if (initialAuthStateResolved) {
          await clearSessionCookie();
          setSessionError(null);
        }
        initialAuthStateResolved = true;
        setLoading(false);
      });

      const unsubscribeToken = onIdTokenChanged(auth, async (nextUser) => {
        if (cancelled || !nextUser) {
          return;
        }
        try {
          await establishSession(nextUser);
          setSessionError(null);
        } catch (err) {
          setSessionError(
            err instanceof Error ? err.message : copy('auth.session.refreshFailed'),
          );
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeToken();
      };
    }

    let unsubscribe: (() => void) | undefined;
    void initAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await establishSession(credential.user);
    setSessionError(null);
    await navigateAfterAuth(credential.user);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await establishSession(credential.user);
    setSessionError(null);
    await navigateAfterAuth(credential.user);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();

    if (shouldUseGoogleRedirect()) {
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      const credential = await signInWithPopup(auth, provider);
      await establishSession(credential.user);
      setSessionError(null);
      await navigateAfterAuth(credential.user);
    } catch (error) {
      setSessionError(firebaseAuthErrorMessage(error));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearSessionCookie();
    await firebaseSignOut(getFirebaseAuth());
    setSessionError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, sessionError, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
