import type { ReactNode } from 'react';

interface SettingsSectionCardProps {
  title: string;
  children: ReactNode;
}

export function SettingsSectionCard({ title, children }: SettingsSectionCardProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}
