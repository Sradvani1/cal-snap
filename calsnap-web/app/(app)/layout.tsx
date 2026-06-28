'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BottomTabNav } from '@/components/app/BottomTabNav';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { useAuth } from '@/lib/auth/use-auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';
import { copy } from '@/lib/copy';
import { UnsavedWorkProvider } from '@/lib/scanner/unsaved-work-context';

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
      <div className="flex min-h-full flex-1 items-center justify-center bg-cs-background">
        <p className="text-cs-muted">{copy('common.loading')}</p>
      </div>
    );
  }

  return (
    <UnsavedWorkProvider>
      <div className="min-h-full bg-cs-background pb-20">
        {sessionError && (
          <div className="mx-auto max-w-lg px-4 pt-4">
            <SessionErrorBanner message={sessionError} />
          </div>
        )}
        <main>{children}</main>
        <BottomTabNav />
      </div>
    </UnsavedWorkProvider>
  );
}
