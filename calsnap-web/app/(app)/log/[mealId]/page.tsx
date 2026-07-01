'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealDetailActions } from '@/components/meal-log/MealDetailActions';
import { MealDetailView } from '@/components/meal-log/MealDetailView';
import { MealShareCard } from '@/components/meal-log/MealShareCard';
import { useMealShareImage } from '@/components/meal-log/use-meal-share-image';
import { useAuth } from '@/lib/auth/use-auth';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useMeal } from '@/lib/queries/use-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';

interface MealDetailPageProps {
  params: Promise<{ mealId: string }>;
}

export default function MealDetailPage({ params }: MealDetailPageProps) {
  const { mealId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const mealQuery = useMeal(user?.uid, mealId);
  const deleteMealMutation = useDeleteMeal(user?.uid);
  const { shareCardImage, isSharing, shareError } = useMealShareImage();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const meal = mealQuery.data?.entry;

  useEffect(() => {
    if (!meal?.photoStoragePath) {
      return;
    }

    let cancelled = false;

    void getMealPhotoDownloadUrl(meal.photoStoragePath)
      .then((url) => {
        if (!cancelled) {
          setPhotoUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhotoUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meal?.photoStoragePath]);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!meal) {
      return;
    }

    try {
      await deleteMealMutation.mutateAsync(meal.id);
      router.replace('/log');
    } catch {
      // error shown via deleteMealMutation.error below
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current || !meal) {
      return;
    }
    await shareCardImage(shareCardRef.current, `calsnap-meal-${meal.id}.png`);
  };

  if (mealQuery.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-cs-muted/20" />
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-cs-muted/20" />
      </div>
    );
  }

  if (mealQuery.isError || !meal) {
    const notFound = mealQuery.error instanceof MealNotFoundError;
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className={`${typography.csCardTitle} mb-4 text-2xl`}>{copy('mealLog.detail.title')}</h1>
        <p className={`${typography.csCaption} mb-4`}>
          {notFound ? copy('mealLog.detail.notFound') : copy('mealLog.detail.loadFailed')}
        </p>
        <Link href="/log" className={`${typography.csBody} font-medium underline`}>
          {copy('mealLog.detail.backToLog')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <header className="mb-6">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('mealLog.detail.title')}</h1>
      </header>

      <MealDetailView
        meal={meal}
        photoUrl={meal.photoStoragePath ? photoUrl : null}
      />

      <div className="mt-6">
        <MealDetailActions
          mealId={meal.id}
          onShare={() => void handleShare()}
          onDelete={handleDelete}
          isSharing={isSharing}
          isDeleting={deleteMealMutation.isPending}
        />
      </div>

      {deleteMealMutation.isError && (
        <p className="mt-3 text-sm text-cs-danger">{copy('mealLog.error.deleteFailed')}</p>
      )}

      {shareError && (
        <p className="mt-3 text-sm text-cs-danger">{shareError}</p>
      )}

      <ConfirmAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={copy('mealLog.confirm.deleteTitle')}
        description={copy('mealLog.confirm.delete')}
        confirmLabel={copy('mealLog.confirm.deleteAction')}
        destructive
        onConfirm={() => void handleConfirmDelete()}
      />

      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div ref={shareCardRef}>
          <MealShareCard
            mealType={meal.mealType}
            timestamp={meal.timestamp}
            totalCalories={meal.totalCalories}
            proteinG={meal.totalProteinG}
            carbsG={meal.totalCarbsG}
            fatG={meal.totalFatG}
          />
        </div>
      </div>
    </div>
  );
}
