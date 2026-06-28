'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { getProfile } from '@/lib/repositories/profile';
import type { UserProfile } from '@/lib/models/user-profile';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    void getProfile(user.uid).then(setProfile);
  }, [user]);

  const greeting = profile?.name ? `Hi, ${profile.name}` : 'Hi there';

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm font-medium text-neutral-600 underline"
        >
          Sign out
        </button>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-lg text-neutral-900">{greeting}</p>
        {profile ? (
          <p className="mt-2 text-neutral-600">
            Your daily calorie target is{' '}
            <span className="font-semibold text-neutral-900">
              {profile.dailyCalorieTarget} kcal
            </span>
          </p>
        ) : (
          <p className="mt-2 text-neutral-500">Loading profile…</p>
        )}
      </div>

      <p className="text-center text-xs text-neutral-400">
        Full dashboard features coming in W03.
      </p>
    </div>
  );
}
