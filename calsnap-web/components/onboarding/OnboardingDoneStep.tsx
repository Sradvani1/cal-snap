'use client';

import { useEffect } from 'react';

interface OnboardingDoneStepProps {
  onComplete: () => void;
}

export function OnboardingDoneStep({ onComplete }: OnboardingDoneStepProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-neutral-900">You&apos;re all set!</h2>
      <p className="text-sm text-neutral-600">
        Your profile has been saved. Taking you to your dashboard…
      </p>
    </div>
  );
}
