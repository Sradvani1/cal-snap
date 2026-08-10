'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingStepSkeleton } from '@/components/onboarding/OnboardingStepSkeleton';
import { ProfileLoadError } from '@/components/auth/ProfileLoadError';
import { useAuth } from '@/lib/auth/auth-context';
import { resolveProfileRoute } from '@/lib/auth/resolve-profile-route';
import { layout } from '@/lib/design/layout';
import { useProfile } from '@/lib/queries/use-profile';
import { cn } from '@/lib/utils/cn';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const profile = useProfile(user?.uid);
  const router = useRouter();

  const loading = authLoading || (Boolean(user) && profile.isLoading);
  const route = resolveProfileRoute({
    authLoading,
    hasUser: user != null,
    profilePending: profile.isPending,
    profileError: profile.isError,
    onboardingCompleted: profile.data?.extras.onboardingCompleted,
  });

  useEffect(() => {
    if (route === '/login') {
      router.replace('/login');
      return;
    }
    if (route === '/dashboard') {
      router.replace('/dashboard');
    }
  }, [route, router]);

  if (profile.isError) {
    return (
      <main
        className={cn(
          layout.content.onboardingMainScrollClass,
          'min-h-dvh overflow-x-hidden bg-cs-background p-6',
        )}
      >
        <ProfileLoadError
          onRetry={() => void profile.refetch()}
          onSignOut={() => void signOut()}
        />
      </main>
    );
  }

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
