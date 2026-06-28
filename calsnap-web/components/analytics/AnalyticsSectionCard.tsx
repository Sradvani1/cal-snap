import type { ReactNode } from 'react';

interface AnalyticsSectionCardProps {
  title: string;
  children: ReactNode;
}

export function AnalyticsSectionCard({ title, children }: AnalyticsSectionCardProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}

export function AnalyticsSectionCardSkeleton() {
  return (
    <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
  );
}
