'use client';

import { Skeleton } from '@/components/design/Skeleton';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';

interface MealDetailSkeletonProps {
  variant: 'detail' | 'edit';
  showPhoto?: boolean;
}

export function MealDetailSkeleton({ variant, showPhoto = true }: MealDetailSkeletonProps) {
  return (
    <div
      aria-busy="true"
      className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}
    >
      <Skeleton className="mb-6 h-8 w-32" />

      {variant === 'detail' ? (
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {showPhoto ? <Skeleton className="aspect-[4/3] w-full rounded-xl" /> : null}
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
