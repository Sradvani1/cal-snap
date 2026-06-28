'use client';

import Link from 'next/link';
import { use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MealAnalysisResultView } from '@/components/scanner/MealAnalysisResultView';
import { useAuth } from '@/lib/auth/use-auth';
import { useMeal } from '@/lib/queries/use-meal';
import { useUpdateMeal } from '@/lib/queries/use-update-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';

interface ScanEditPageProps {
  params: Promise<{ mealId: string }>;
}

export default function ScanEditPage({ params }: ScanEditPageProps) {
  const { mealId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const updateMealMutation = useUpdateMeal(user?.uid);
  const loadedMealIdRef = useRef<string | null>(null);

  const mealQuery = useMeal(user?.uid, mealId, { fresh: true });

  const scanner = useMealScanner({
    userId: user?.uid ?? '',
    onUnsavedWorkChange: setHasUnsavedWork,
  });

  const { discard, loadForEditing } = scanner;

  useEffect(() => {
    loadedMealIdRef.current = null;
  }, [mealId]);

  useEffect(() => {
    if (!mealQuery.data || loadedMealIdRef.current === mealQuery.data.entry.id) {
      return;
    }

    let cancelled = false;

    async function load() {
      const { entry: meal } = mealQuery.data!;
      let photoUrl: string | null = null;
      if (meal.photoStoragePath) {
        try {
          photoUrl = await getMealPhotoDownloadUrl(meal.photoStoragePath);
        } catch {
          photoUrl = null;
        }
      }

      if (cancelled) {
        return;
      }

      loadedMealIdRef.current = meal.id;
      loadForEditing(meal, photoUrl);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [mealQuery.data, loadForEditing]);

  useEffect(() => {
    registerNavigationHandler(() => {
      const confirmed = window.confirm(
        'Discard unsaved edits? Your changes will be lost.',
      );
      if (confirmed) {
        discard();
      }
      return confirmed;
    });
    return () => {
      setHasUnsavedWork(false);
      registerNavigationHandler(null);
    };
  }, [registerNavigationHandler, discard, setHasUnsavedWork]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (scanner.hasUnsavedWork) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scanner.hasUnsavedWork]);

  const handleDiscard = () => {
    if (scanner.hasUnsavedWork) {
      const confirmed = window.confirm(
        'Discard unsaved edits? Your changes will be lost.',
      );
      if (!confirmed) {
        return;
      }
    }
    scanner.discard();
    router.push(`/log/${mealId}`);
  };

  const handleSave = async () => {
    if (!user || !scanner.canLog || !mealQuery.data) {
      return;
    }
    scanner.setLogError(null);

    try {
      const entry = scanner.makeEditMealEntry();
      const existingCreatedAt = mealQuery.data.createdAt;

      await updateMealMutation.mutateAsync({
        entry,
        existingCreatedAt,
      });
      scanner.discard();
      setHasUnsavedWork(false);
      router.push(`/log/${mealId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save meal. Try again.';
      scanner.setLogError(message);
    }
  };

  if (mealQuery.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="space-y-4">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (mealQuery.isError) {
    const notFound = mealQuery.error instanceof MealNotFoundError;
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-neutral-900">Edit meal</h1>
        <p className="mb-4 text-sm text-neutral-600">
          {notFound ? 'Meal not found.' : 'Could not load meal.'}
        </p>
        <Link href="/log" className="text-sm font-medium text-neutral-900 underline">
          Back to log
        </Link>
      </div>
    );
  }

  if (scanner.phase !== 'results') {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Edit meal</h1>
        {scanner.hasUnsavedWork && (
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-medium text-red-600"
          >
            Cancel
          </button>
        )}
      </header>

      <MealAnalysisResultView
        scanner={scanner}
        isLogging={updateMealMutation.isPending}
        onLog={() => void handleSave()}
        onReAnalyze={() => {}}
        onDiscard={handleDiscard}
        isEditing
      />
    </div>
  );
}
