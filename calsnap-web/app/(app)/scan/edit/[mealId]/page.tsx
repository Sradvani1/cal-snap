'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealDetailSkeleton } from '@/components/meal-log/MealDetailSkeleton';
import { MealAnalysisResultView } from '@/components/scanner/MealAnalysisResultView';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';
import { useMeal } from '@/lib/queries/use-meal';
import { useUpdateMeal } from '@/lib/queries/use-update-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';

type DiscardPrompt = 'navigation' | 'discard' | null;

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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<DiscardPrompt>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const mealQuery = useMeal(user?.uid, mealId, { fresh: true });

  const scanner = useMealScanner({
    userId: user?.uid ?? '',
    onUnsavedWorkChange: setHasUnsavedWork,
  });

  const { discard, loadForEditing } = scanner;

  const openDiscardDialog = (prompt: DiscardPrompt, href?: string) => {
    setDiscardPrompt(prompt);
    setPendingHref(href ?? null);
    setDiscardDialogOpen(true);
  };

  const handleConfirmDiscard = () => {
    discard();
    setHasUnsavedWork(false);
    setDiscardDialogOpen(false);
    if (discardPrompt === 'navigation' && pendingHref) {
      router.push(pendingHref);
    } else if (discardPrompt === 'discard') {
      router.push(`/log/${mealId}`);
    }
    setDiscardPrompt(null);
    setPendingHref(null);
  };

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
    registerNavigationHandler((href) => {
      openDiscardDialog('navigation', href);
      return false;
    });
    return () => {
      setHasUnsavedWork(false);
      registerNavigationHandler(null);
    };
  }, [registerNavigationHandler, setHasUnsavedWork]);

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
      openDiscardDialog('discard');
      return;
    }
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
    } catch {
      scanner.setLogError(copy('scanner.error.saveFailed'));
    }
  };

  if (mealQuery.isLoading) {
    return <MealDetailSkeleton variant="edit" showPhoto />;
  }

  if (mealQuery.isError) {
    const notFound = mealQuery.error instanceof MealNotFoundError;
    return (
      <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
        <h1 className={`${typography.csCardTitle} mb-4 text-2xl`}>{copy('scanner.edit.title')}</h1>
        <p className={`${typography.csCaption} mb-4`}>
          {notFound ? copy('scanner.error.mealNotFound') : copy('scanner.error.mealLoadFailed')}
        </p>
        <Link href="/log" className={`${typography.csBody} font-medium underline`}>
          {copy('scanner.error.backToLog')}
        </Link>
      </div>
    );
  }

  if (scanner.phase !== 'results') {
    return <MealDetailSkeleton variant="edit" showPhoto={false} />;
  }

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('scanner.edit.title')}</h1>
        {scanner.hasUnsavedWork && (
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-medium text-cs-danger"
          >
            {copy('common.button.cancel')}
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

      <ConfirmAlertDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title={copy('scanner.confirm.discardTitle')}
        description={copy('scanner.confirm.discardEdits')}
        confirmLabel={copy('scanner.discard')}
        destructive
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
