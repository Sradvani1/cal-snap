'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MealDetailActions } from '@/components/meal-log/MealDetailActions';
import { MealDetailView } from '@/components/meal-log/MealDetailView';
import { MealShareCard } from '@/components/meal-log/MealShareCard';
import { useMealShareImage } from '@/components/meal-log/use-meal-share-image';
import { useAuth } from '@/lib/auth/use-auth';
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

  const handleDelete = async () => {
    if (!meal) {
      return;
    }
    const confirmed = window.confirm('Delete this meal? This cannot be undone.');
    if (!confirmed) {
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
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (mealQuery.isError || !meal) {
    const notFound = mealQuery.error instanceof MealNotFoundError;
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-neutral-900">Meal detail</h1>
        <p className="mb-4 text-sm text-neutral-600">
          {notFound ? 'Meal not found.' : 'Could not load meal.'}
        </p>
        <Link href="/log" className="text-sm font-medium text-neutral-900 underline">
          Back to log
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Meal detail</h1>
      </header>

      <MealDetailView
        meal={meal}
        photoUrl={meal.photoStoragePath ? photoUrl : null}
      />

      <div className="mt-6">
        <MealDetailActions
          mealId={meal.id}
          onShare={() => void handleShare()}
          onDelete={() => void handleDelete()}
          isSharing={isSharing}
          isDeleting={deleteMealMutation.isPending}
        />
      </div>

      {deleteMealMutation.isError && (
        <p className="mt-3 text-sm text-red-600">
          {deleteMealMutation.error instanceof Error
            ? deleteMealMutation.error.message
            : 'Failed to delete meal. Try again.'}
        </p>
      )}

      {shareError && (
        <p className="mt-3 text-sm text-red-600">{shareError}</p>
      )}

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
