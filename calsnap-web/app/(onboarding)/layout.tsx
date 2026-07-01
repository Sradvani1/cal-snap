'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { useProfile } from '@/lib/queries/use-profile';

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
