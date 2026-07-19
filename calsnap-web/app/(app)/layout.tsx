'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import { AppShellSkeleton } from '@/components/app/AppShellSkeleton';
import { BottomTabNav } from '@/components/app/BottomTabNav';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { scrollMainToTop } from '@/lib/app/scroll-main';
import { isTabRootPathname } from '@/lib/app/tab-navigation';
import { useRequireAuth } from '@/lib/auth/auth-context';
import { useKeyboardActiveViewport } from '@/lib/hooks/use-keyboard-active-viewport';
import { layout } from '@/lib/design/layout';
import { UnsavedWorkProvider } from '@/lib/scanner/unsaved-work-context';
import { cn } from '@/lib/utils/cn';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useKeyboardActiveViewport();
  const { user, ready } = useRequireAuth();
  const pathname = usePathname();
  const mainScrollRef = useRef<HTMLElement>(null);
  const prevPathnameRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === null || prev === pathname) {
      return;
    }
    if (isTabRootPathname(pathname)) {
      scrollMainToTop(mainScrollRef.current);
    }
  }, [pathname]);

  if (!ready) {
    return (
      <main
        aria-busy="true"
        className={cn(
          layout.content.mainScrollClass,
          'min-h-dvh overflow-x-hidden bg-cs-background',
        )}
      >
        <AppShellSkeleton />
      </main>
    );
  }

  return (
    <UnsavedWorkProvider>
      <div className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden bg-cs-background">
        <InstallPromptBanner uid={user!.uid} />
        <main
          ref={mainScrollRef}
          className={cn(
            layout.content.mainScrollClass,
            'flex-1 min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto [overscroll-behavior:contain]',
          )}
        >
          {children}
        </main>
        <BottomTabNav />
      </div>
    </UnsavedWorkProvider>
  );
}
