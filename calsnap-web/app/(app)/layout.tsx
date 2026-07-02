'use client';

import { AppShellSkeleton } from '@/components/app/AppShellSkeleton';
import { BottomTabNav } from '@/components/app/BottomTabNav';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { useRequireAuth } from '@/lib/auth/auth-context';
import { UnsavedWorkProvider } from '@/lib/scanner/unsaved-work-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireAuth();

  if (!ready) {
    return (
      <main aria-busy="true" className="min-h-full overflow-x-hidden bg-cs-background">
        <AppShellSkeleton />
      </main>
    );
  }

  return (
    <UnsavedWorkProvider>
      <div className="min-h-full overflow-x-hidden bg-cs-background">
        <InstallPromptBanner uid={user!.uid} />
        <main className="w-full min-w-0 overflow-x-hidden">{children}</main>
        <BottomTabNav />
      </div>
    </UnsavedWorkProvider>
  );
}
