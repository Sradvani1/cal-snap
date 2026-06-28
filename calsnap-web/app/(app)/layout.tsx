'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BottomTabNav } from '@/components/app/BottomTabNav';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { useAuth } from '@/lib/auth/use-auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, sessionError } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    void isOnboardingComplete(user.uid).then((complete) => {
      if (cancelled) {
        return;
      }
      if (!complete) {
        router.replace('/onboarding');
        return;
      }
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-neutral-50">
        <p className="text-neutral-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50 pb-20">
      {sessionError && (
        <div className="mx-auto max-w-lg px-4 pt-4">
          <SessionErrorBanner message={sessionError} />
        </div>
      )}
      <main>{children}</main>
      <BottomTabNav />
    </div>
  );
}
