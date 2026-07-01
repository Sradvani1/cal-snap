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
import {
  resolveDeferredAuthUser,
  shouldClearSessionCookie,
  type PendingAuthUser,
} from '@/lib/auth/auth-redirect-state';
import { shouldUseGoogleRedirect } from '@/lib/auth/google-sign-in-strategy';
import { navigateAfterAuth } from '@/lib/auth/navigate-after-auth';
import { mapFirebaseAuthError } from '@/lib/auth/firebase-auth-errors';
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
    let redirectSettled = false;
    let pendingAuthUser: PendingAuthUser = undefined;

    async function applyAuthState(
      nextUser: User | null,
      options: { clearSessionWhenSignedOut: boolean; redirectAfterSignIn: boolean },
    ) {
      if (cancelled) {
        return;
      }
      setUser(nextUser);
      if (nextUser) {
        let sessionOk = false;
        try {
          await establishSession(nextUser);
          setSessionError(null);
          sessionOk = true;
        } catch (err) {
          await clearSessionCookie();
          setSessionError(
            err instanceof Error ? err.message : copy('auth.session.establishFailed'),
          );
        }
        setLoading(false);
        if (
          sessionOk &&
          options.redirectAfterSignIn &&
          typeof window !== 'undefined' &&
          (window.location.pathname === '/login' || window.location.pathname === '/signup')
        ) {
          await navigateAfterAuth(nextUser);
        }
        return;
      }
      if (options.clearSessionWhenSignedOut) {
        await clearSessionCookie();
        setSessionError(null);
      }
      setLoading(false);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      if (cancelled) {
        return;
      }
      if (!redirectSettled) {
        pendingAuthUser = nextUser;
        return;
      }
      void applyAuthState(nextUser, {
        clearSessionWhenSignedOut: shouldClearSessionCookie(true, nextUser),
        redirectAfterSignIn: true,
      });
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

    void (async () => {
      let handledRedirectUser = false;
      try {
        const redirectResult = await consumeGoogleRedirectResult(auth);
        const redirectUser = redirectResult?.user ?? auth.currentUser;

        if (!cancelled && redirectUser) {
          handledRedirectUser = true;
          try {
            await establishSession(redirectUser);
            setSessionError(null);
          } catch (err) {
            setSessionError(
              err instanceof Error ? err.message : copy('auth.session.establishFailed'),
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(mapFirebaseAuthError(error, 'auth.session.googleRedirectFailed'));
        }
      } finally {
        if (cancelled) {
          return;
        }
        redirectSettled = true;

        if (handledRedirectUser && auth.currentUser) {
          void applyAuthState(auth.currentUser, {
            clearSessionWhenSignedOut: false,
            redirectAfterSignIn: true,
          });
          return;
        }

        const userToApply = resolveDeferredAuthUser(pendingAuthUser, auth.currentUser);
        void applyAuthState(userToApply, {
          clearSessionWhenSignedOut: shouldClearSessionCookie(true, userToApply),
          redirectAfterSignIn: true,
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await establishSession(credential.user);
      setSessionError(null);
      await navigateAfterAuth(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error, 'auth.login.error'));
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await establishSession(credential.user);
      setSessionError(null);
      await navigateAfterAuth(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error, 'auth.signup.error'));
    }
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
      throw new Error(mapFirebaseAuthError(error, 'auth.session.googleRedirectFailed'));
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
