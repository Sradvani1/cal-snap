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
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
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
  await fetch('/api/auth/session', { method: 'DELETE' });
}

async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

    async function initAuth() {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          await establishSession(redirectResult.user);
          if (!cancelled) {
            setSessionError(null);
          }
        }
      } catch {
        // Redirect result errors are non-fatal; onAuthStateChanged handles state.
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
        } else {
          await clearSessionCookie();
          setSessionError(null);
        }
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
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await establishSession(credential.user);
    setSessionError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
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
