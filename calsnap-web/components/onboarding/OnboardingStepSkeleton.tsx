'use client';

import { Skeleton } from '@/components/design/Skeleton';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';

export function OnboardingStepSkeleton() {
  return (
    <div
      aria-busy="true"
      className={cn(layout.pageShell, 'min-h-full gap-5 py-8')}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-cs-border bg-cs-surface p-4 sm:p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
