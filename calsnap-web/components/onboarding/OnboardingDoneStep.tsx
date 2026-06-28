'use client';

import { useEffect } from 'react';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cs-success/15 text-2xl text-cs-success">
        ✓
      </div>
      <h2 className={typography.csCardTitle}>{copy('onboarding.done.title')}</h2>
      <p className={typography.csCaption}>{copy('onboarding.done.redirecting')}</p>
    </div>
  );
}
