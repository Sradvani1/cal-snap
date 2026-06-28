'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }

    void isOnboardingComplete(user.uid).then((complete) => {
      router.replace(complete ? '/dashboard' : '/onboarding');
    });
  }, [loading, user, router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-neutral-50">
      <p className="text-neutral-600">Loading…</p>
    </div>
  );
}
