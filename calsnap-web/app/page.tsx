'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      // Middleware only serves / when __session is valid; wait for Firebase to restore.
      return;
    }

    void isOnboardingComplete(user.uid).then((complete) => {
      router.replace(complete ? '/dashboard' : '/onboarding');
    });
  }, [loading, user, router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-cs-background">
      <p className={typography.csCaption}>{copy('common.loading')}</p>
    </div>
  );
}
