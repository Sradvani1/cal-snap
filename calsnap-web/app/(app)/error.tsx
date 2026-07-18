'use client';

import { useEffect } from 'react';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className={typography.csCardTitle}>{copy('common.error.title')}</h1>
      <p className={typography.csCaption}>{copy('common.error.description')}</p>
      <PrimaryButton type="button" onClick={() => unstable_retry()}>
        {copy('common.button.retry')}
      </PrimaryButton>
    </div>
  );
}
