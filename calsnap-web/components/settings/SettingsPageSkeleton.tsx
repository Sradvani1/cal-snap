'use client';

import { SectionCardSkeleton } from '@/components/design/SectionCard';
import { Skeleton } from '@/components/design/Skeleton';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';

export function SettingsPageSkeleton() {
  return (
    <div
      aria-busy="true"
      className={cn(layout.pageShell, 'min-h-full gap-4 py-8', layout.content.bottomPadding)}
    >
      <header>
        <Skeleton className="h-8 w-32" />
      </header>

      <SectionCardSkeleton />
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </div>
  );
}
