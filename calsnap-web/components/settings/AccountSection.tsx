'use client';

import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

interface AccountSectionProps {
  onSignOut: () => void;
}

export function AccountSection({ onSignOut }: AccountSectionProps) {
  return (
    <SettingsSectionCard title="Account">
      <button
        type="button"
        onClick={onSignOut}
        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
      >
        Sign out
      </button>
    </SettingsSectionCard>
  );
}
