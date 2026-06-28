'use client';

import { StubPage } from '@/components/app/StubPage';
import { useAuth } from '@/lib/auth/use-auth';

export default function SettingsPage() {
  const { signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-4 py-8">
      <StubPage title="Settings" comingIn="W08" />
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
      >
        Sign out
      </button>
    </div>
  );
}
