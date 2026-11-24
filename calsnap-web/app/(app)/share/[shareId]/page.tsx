'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { MealDetailSkeleton } from '@/components/meal-log/MealDetailSkeleton';
import { MealDetailView } from '@/components/meal-log/MealDetailView';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { useAddSharedMeal } from '@/lib/queries/use-add-shared-meal';
import { useSharedMeal } from '@/lib/queries/use-shared-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { SharedMealUnavailableError } from '@/lib/repositories/shared-meals';
import { cn } from '@/lib/utils/cn';

interface SharedMealPageProps {
  params: Promise<{ shareId: string }>;
}

export default function SharedMealPage({ params }: SharedMealPageProps) {
  const { shareId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const sharedQuery = useSharedMeal(user?.uid, shareId);
  const addMutation = useAddSharedMeal(user?.uid);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const shared = sharedQuery.data;
  const photoPath = shared?.entry.photoStoragePath;

  useEffect(() => {
    if (!photoPath) {
      return;
    }
    let cancelled = false;
    void getMealPhotoDownloadUrl(photoPath)
      .then((url) => {
        if (!cancelled) setPhotoUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [photoPath]);

  const handleAdd = async () => {
    if (!shared) return;
    try {
      const mealId = await addMutation.mutateAsync({ shareId, entry: shared.entry });
      router.replace(`/log/${mealId}`);
    } catch {
      // error shown via addMutation.error
    }
  };

  if (sharedQuery.isPending) {
    return <MealDetailSkeleton variant="detail" />;
  }

  if (!shared) {
    const error = sharedQuery.error;
    const unavailable = error instanceof SharedMealUnavailableError;
    const addedMealId = unavailable ? error.addedMealId : null;
    return (
      <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
        <h1 className={`${typography.csCardTitle} mb-4 text-2xl`}>{copy('mealLog.share.title')}</h1>
        <p className={`${typography.csCaption} mb-4`}>
          {unavailable ? copy('mealLog.share.unavailable') : copy('mealLog.share.loadFailed')}
        </p>
        {addedMealId ? (
          <PrimaryButton
            type="button"
            fullWidth
            className="min-h-11"
            onClick={() => router.push(`/log/${addedMealId}`)}
          >
            {copy('mealLog.share.viewInLog')}
          </PrimaryButton>
        ) : (
          <Link href="/log" className={`${typography.csBody} font-medium underline`}>
            {copy('mealLog.detail.backToLog')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('mealLog.share.title')}</h1>
      </header>

      <MealDetailView meal={shared.entry} photoUrl={photoUrl} />

      <div className="mt-6 flex flex-col gap-3">
        {shared.addedMealId ? (
          <>
            <p className="text-center text-sm text-cs-muted">{copy('mealLog.share.alreadyAdded')}</p>
            <PrimaryButton
              type="button"
              fullWidth
              className="min-h-11"
              onClick={() => router.push(`/log/${shared.addedMealId}`)}
            >
              {copy('mealLog.share.viewInLog')}
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton
            type="button"
            fullWidth
            className="min-h-11"
            disabled={addMutation.isPending}
            onClick={() => void handleAdd()}
          >
            {addMutation.isPending ? copy('mealLog.share.adding') : copy('mealLog.share.addToLog')}
          </PrimaryButton>
        )}

        {addMutation.isError && (
          <p className="text-center text-sm text-cs-danger">{copy('mealLog.share.addError')}</p>
        )}
      </div>
    </div>
  );
}
