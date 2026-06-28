'use client';

import { SecondaryButton } from '@/components/design/PrimaryButton';
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';

interface AccountSectionProps {
  onSignOut: () => void;
}

export function AccountSection({ onSignOut }: AccountSectionProps) {
  return (
    <SectionCard title={copy('settings.section.account')}>
      <SecondaryButton type="button" onClick={onSignOut} fullWidth className="min-h-11">
        {copy('settings.account.signOut')}
      </SecondaryButton>
    </SectionCard>
  );
}
