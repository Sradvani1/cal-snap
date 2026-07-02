'use client';

import { Skeleton } from '@/components/design/Skeleton';

export function AuthFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>

      <Skeleton className="mx-auto h-4 w-8" />

      <Skeleton className="h-11 w-full rounded-lg" />

      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
