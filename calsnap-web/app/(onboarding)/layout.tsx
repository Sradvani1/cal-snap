'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { copy } from '@/lib/copy';
import { useAuth } from '@/lib/auth/use-auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
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
    void isOnboardingComplete(user.uid)
      .then((complete) => {
        if (cancelled) {
          return;
        }
        if (complete) {
          router.replace('/dashboard');
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) {
          setChecking(false);
        }
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
    <div className="min-h-full overflow-x-hidden bg-cs-background">
      {children}
    </div>
  );
}
