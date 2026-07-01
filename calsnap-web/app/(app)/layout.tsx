'use client';

import { BottomTabNav } from '@/components/app/BottomTabNav';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { useRequireAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { UnsavedWorkProvider } from '@/lib/scanner/unsaved-work-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, ready } = useRequireAuth();

  if (loading || !ready || !user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-cs-background">
        <p className="text-cs-muted">{copy('common.loading')}</p>
      </div>
    );
  }

  return (
    <UnsavedWorkProvider>
      <div className="min-h-full overflow-x-hidden bg-cs-background pb-20">
        <InstallPromptBanner uid={user.uid} />
        <main className="w-full min-w-0 overflow-x-hidden">{children}</main>
        <BottomTabNav />
      </div>
    </UnsavedWorkProvider>
  );
}
