'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingStepSkeleton } from '@/components/onboarding/OnboardingStepSkeleton';
import { useAuth } from '@/lib/auth/auth-context';
import { layout } from '@/lib/design/layout';
import { useProfile } from '@/lib/queries/use-profile';
import { cn } from '@/lib/utils/cn';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const profile = useProfile(user?.uid);
  const router = useRouter();

  const loading = authLoading || (Boolean(user) && profile.isLoading);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile.isLoading) {
      return;
    }
    if (profile.data?.extras.onboardingCompleted === true) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, profile.isLoading, profile.data, router]);

  if (loading) {
    return (
      <main
        aria-busy="true"
        className={cn(
          layout.content.onboardingMainScrollClass,
          'min-h-dvh overflow-x-hidden bg-cs-background',
        )}
      >
        <OnboardingStepSkeleton />
      </main>
    );
  }

  return (
    <div
      className={cn(
        layout.content.onboardingMainScrollClass,
        'min-h-dvh overflow-x-hidden bg-cs-background',
      )}
    >
      {children}
    </div>
  );
}
