import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';
import { typography } from '@/lib/design/typography';

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-cs-border bg-cs-surface p-4 shadow-sm dark:shadow-none sm:p-6',
        className,
      )}
    >
      {title ? <h2 className={cn(typography.csCardTitle, 'mb-4')}>{title}</h2> : null}
      {children}
    </section>
  );
}

export function SectionCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-cs-border bg-cs-surface p-4 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="h-6 w-32 animate-pulse rounded bg-cs-muted/20" />
      <div className="mt-4 space-y-3">
        <div className="h-8 animate-pulse rounded bg-cs-muted/20" />
        <div className="h-8 animate-pulse rounded bg-cs-muted/20" />
      </div>
    </div>
  );
}
