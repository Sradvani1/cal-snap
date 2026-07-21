'use client';

import Link from 'next/link';
import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealDetailActions } from '@/components/meal-log/MealDetailActions';
import { MealDetailView } from '@/components/meal-log/MealDetailView';
import { MealDetailSkeleton } from '@/components/meal-log/MealDetailSkeleton';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useMeal } from '@/lib/queries/use-meal';
import { useSaveFavorite } from '@/lib/queries/use-save-favorite';
import { useUpdateMeal } from '@/lib/queries/use-update-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';
import {
  editableFoodItemFromFoodItem,
  editableFoodItemToFoodItem,
  updateEditableItemWeight,
  type EditableFoodItem,
} from '@/lib/scanner/editable-food-item';
import { sumEditableItems } from '@/lib/scanner/meal-totals';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { cn } from '@/lib/utils/cn';

interface MealDetailPageProps {
  params: Promise<{ mealId: string }>;
}

type DiscardDialog = 'navigation' | 'cancel' | null;

export default function MealDetailPage({ params }: MealDetailPageProps) {
  const { mealId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const mealQuery = useMeal(user?.uid, mealId);
  const updateMealMutation = useUpdateMeal(user?.uid);
  const deleteMealMutation = useDeleteMeal(user?.uid);
  const saveFavoriteMutation = useSaveFavorite(user?.uid);
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditableFoodItem[] | null>(null);
  const [savedFavorite, setSavedFavorite] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardDialog, setDiscardDialog] = useState<DiscardDialog>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const loadedMealIdRef = useRef<string | null>(null);

  const meal = mealQuery.data?.entry;
  const createdAt = mealQuery.data?.createdAt;

  useEffect(() => {
    if (!meal?.photoStoragePath) {
      return;
    }
    let cancelled = false;
    void getMealPhotoDownloadUrl(meal.photoStoragePath)
      .then((url) => {
        if (!cancelled) setPhotoUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [meal?.photoStoragePath]);

  useEffect(() => {
    if (!meal || loadedMealIdRef.current === meal.id) return;
    loadedMealIdRef.current = meal.id;
    setEditableItems(meal.items.map(editableFoodItemFromFoodItem));
    setHasUnsavedWork(false);
  }, [meal, setHasUnsavedWork]);

  const originalItems = useMemo(
    () => (meal ? meal.items.map(editableFoodItemFromFoodItem) : null),
    [meal],
  );

  const hasChanges = useMemo(() => {
    if (!editableItems || !originalItems) return false;
    return JSON.stringify(editableItems) !== JSON.stringify(originalItems);
  }, [editableItems, originalItems]);

  useEffect(() => {
    setHasUnsavedWork(hasChanges);
  }, [hasChanges, setHasUnsavedWork]);

  const currentTotals = useMemo(
    () => (editableItems ? sumEditableItems(editableItems) : null),
    [editableItems],
  );

  const openDiscardDialog = (prompt: DiscardDialog, href?: string) => {
    setDiscardDialog(prompt);
    setPendingHref(href ?? null);
    setDiscardDialogOpen(true);
  };

  useLayoutEffect(() => {
    registerNavigationHandler((href) => {
      openDiscardDialog('navigation', href);
      return false;
    });
    return () => registerNavigationHandler(null);
  }, [registerNavigationHandler]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const handleWeightChange = (id: string, weightG: number) => {
    setEditableItems((prev) =>
      prev!.map((item) =>
        item.id === id ? updateEditableItemWeight(item, weightG) : item,
      ),
    );
  };

  const handleDeleteItem = (id: string) => {
    setEditableItems((prev) => prev!.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!user || !editableItems || !meal || !createdAt) return;
    const totals = sumEditableItems(editableItems);
    const updatedEntry = {
      ...meal,
      items: editableItems.map(editableFoodItemToFoodItem),
      totalCalories: totals.totalCalories,
      totalProteinG: totals.totalProteinG,
      totalCarbsG: totals.totalCarbsG,
      totalFatG: totals.totalFatG,
      totalFiberG: totals.totalFiberG,
      isManuallyAdjusted: true,
    };
    try {
      await updateMealMutation.mutateAsync({ entry: updatedEntry, existingCreatedAt: createdAt });
      setHasUnsavedWork(false);
      loadedMealIdRef.current = null; // allow re-init on refetch
    } catch {
      // error shown via updateMealMutation.error
    }
  };

  const handleCancel = () => {
    if (!meal) return;
    setEditableItems(meal.items.map(editableFoodItemFromFoodItem));
    setHasUnsavedWork(false);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!meal) return;
    try {
      await deleteMealMutation.mutateAsync(meal.id);
      router.replace('/log');
    } catch {
      // error shown via deleteMealMutation.error
    }
  };

  const handleSaveFavorite = () => {
    if (!meal || !user) return;
    saveFavoriteMutation.mutate(meal);
    setSavedFavorite(true);
    setTimeout(() => setSavedFavorite(false), 2000);
  };

  const handleConfirmDiscard = () => {
    setDiscardDialogOpen(false);
    setHasUnsavedWork(false);
    if (discardDialog === 'navigation' && pendingHref) {
      router.push(pendingHref);
      return;
    }
    handleCancel();
  };

  if (mealQuery.isLoading) {
    return <MealDetailSkeleton variant="detail" />;
  }

  if (mealQuery.isError || !meal) {
    const notFound = mealQuery.error instanceof MealNotFoundError;
    return (
      <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
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
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('mealLog.detail.title')}</h1>
        <button
          type="button"
          onClick={handleSaveFavorite}
          disabled={savedFavorite}
          className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg ${
            savedFavorite ? 'text-cs-danger' : 'text-cs-muted hover:text-cs-danger'
          }`}
          aria-label={savedFavorite ? copy('mealLog.actions.savedFavorite') : copy('mealLog.actions.saveFavorite')}
        >
          {savedFavorite ? '♥' : '♡'}
        </button>
      </header>

      <MealDetailView
        meal={meal}
        photoUrl={meal.photoStoragePath ? photoUrl : null}
        editableItems={editableItems}
        totalsOverride={currentTotals ?? undefined}
        onWeightChange={handleWeightChange}
        onDeleteItem={handleDeleteItem}
      />

      <div className="mt-6">
        <MealDetailActions
          hasChanges={hasChanges}
          itemCount={editableItems?.length ?? 0}
          isSaving={updateMealMutation.isPending}
          isDeleting={deleteMealMutation.isPending}
          savedFavorite={savedFavorite}
          onSave={() => void handleSave()}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onSaveFavorite={handleSaveFavorite}
        />
      </div>

      {updateMealMutation.isError && (
        <p className="mt-3 text-sm text-cs-danger">{copy('scanner.error.saveFailed')}</p>
      )}

      {deleteMealMutation.isError && (
        <p className="mt-3 text-sm text-cs-danger">{copy('mealLog.error.deleteFailed')}</p>
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
