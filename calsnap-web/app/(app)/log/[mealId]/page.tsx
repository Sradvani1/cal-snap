'use client';

import Link from 'next/link';
import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealDetailActions } from '@/components/meal-log/MealDetailActions';
import { MealDetailView } from '@/components/meal-log/MealDetailView';
import { MealDetailSkeleton } from '@/components/meal-log/MealDetailSkeleton';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { useCreateSharedMeal } from '@/lib/queries/use-create-shared-meal';
import { useDeleteFavorite } from '@/lib/queries/use-delete-favorite';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useFavorites } from '@/lib/queries/use-favorites';
import { useMeal } from '@/lib/queries/use-meal';
import { useSaveFavorite } from '@/lib/queries/use-save-favorite';
import { useUpdateMeal } from '@/lib/queries/use-update-meal';
import { getMealPhotoDownloadUrl } from '@/lib/repositories/meals';
import { MealNotFoundError } from '@/lib/repositories/meal-errors';
import {
  editableFoodItemFromFoodItem,
  editableFoodItemToFoodItem,
  editableFoodItemsEqual,
  updateEditableItemWeight,
  type EditableFoodItem,
} from '@/lib/scanner/editable-food-item';
import { sumEditableItems } from '@/lib/scanner/meal-totals';
import { sharedMealSummary } from '@/lib/shares/shared-meal-summary';
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
  const deleteFavoriteMutation = useDeleteFavorite(user?.uid);
  const createSharedMealMutation = useCreateSharedMeal(user?.uid);
  const favoritesQuery = useFavorites(user?.uid);
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [pendingShareUrl, setPendingShareUrl] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<EditableFoodItem[] | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardDialog, setDiscardDialog] = useState<DiscardDialog>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const loadedMealIdRef = useRef<string | null>(null);

  const meal = mealQuery.data?.entry;

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
    return !editableFoodItemsEqual(editableItems, originalItems);
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
    if (!user || !editableItems || !meal) return;
    const totals = sumEditableItems(editableItems);
    const updatedEntry = {
      ...meal,
      items: editableItems.map(editableFoodItemToFoodItem),
      totalCalories: totals.totalCalories,
      totalProteinG: totals.totalProteinG,
      totalCarbsG: totals.totalCarbsG,
      totalFatG: totals.totalFatG,
      totalSaturatedFatG: totals.totalSaturatedFatG,
      totalUnsaturatedFatG: totals.totalUnsaturatedFatG,
      totalFiberG: totals.totalFiberG,
      isManuallyAdjusted: true,
    };
    try {
      await updateMealMutation.mutateAsync({ entry: updatedEntry });
      setHasUnsavedWork(false);
      loadedMealIdRef.current = null;
      router.replace('/');
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

  const isFavorited = favoritesQuery.data?.some(
    (f) => f.originalMealId === meal?.id,
  ) ?? false;
  const favoriteId = favoritesQuery.data?.find(
    (f) => f.originalMealId === meal?.id,
  )?.id;

  const favoritePending = saveFavoriteMutation.isPending || deleteFavoriteMutation.isPending;

  const handleToggleFavorite = () => {
    if (!meal || !user || favoritePending) return;
    if (isFavorited && favoriteId) {
      deleteFavoriteMutation.mutate(favoriteId);
    } else {
      saveFavoriteMutation.mutate(meal);
    }
  };

  const copyShareLink = async (url: string) => {
    setPendingShareUrl(null);
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
    } catch {
      setShareStatus('failed');
    }
  };

  const sendShareLink = async (url: string) => {
    if (!meal) return;
    const { title, description } = sharedMealSummary(meal);
    try {
      await navigator.share({ title, text: description, url });
      setPendingShareUrl(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyShareLink(url);
    }
  };

  const handleShare = async () => {
    if (!meal || createSharedMealMutation.isPending) return;
    setShareStatus('idle');
    setPendingShareUrl(null);
    let url: string;
    try {
      const shareId = await createSharedMealMutation.mutateAsync(meal);
      url = `${window.location.origin}/share/${shareId}`;
    } catch {
      return;
    }
    if (typeof navigator.share === 'function') {
      setPendingShareUrl(url);
    } else {
      await copyShareLink(url);
    }
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

  const itemCount = editableItems?.length ?? meal.items.length;

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('mealLog.detail.title')}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={createSharedMealMutation.isPending || hasChanges || itemCount === 0}
            className="flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-cs-muted hover:text-cs-foreground disabled:opacity-50"
          >
            {createSharedMealMutation.isPending ? copy('mealLog.actions.sharing') : copy('mealLog.actions.share')}
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favoritePending}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg text-cs-muted hover:text-cs-warning disabled:opacity-50"
            aria-label={isFavorited ? copy('mealLog.actions.savedFavorite') : copy('mealLog.actions.saveFavorite')}
          >
            {favoritePending ? '⋯' : isFavorited ? '★' : '☆'}
          </button>
        </div>
      </header>

      {hasChanges ? (
        <p className="mb-4 text-sm text-cs-muted">{copy('mealLog.share.saveFirst')}</p>
      ) : (
        <>
          {pendingShareUrl && (
            <PrimaryButton
              type="button"
              fullWidth
              className="mb-4 min-h-11"
              onClick={() => void sendShareLink(pendingShareUrl)}
            >
              {copy('mealLog.share.send')}
            </PrimaryButton>
          )}
          {shareStatus === 'copied' && (
            <p className="mb-4 text-sm text-cs-muted">{copy('mealLog.share.linkCopied')}</p>
          )}
          {(createSharedMealMutation.isError || shareStatus === 'failed') && (
            <p className="mb-4 text-sm text-cs-danger">{copy('mealLog.share.error')}</p>
          )}
        </>
      )}

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
          itemCount={itemCount}
          isSaving={updateMealMutation.isPending}
          isDeleting={deleteMealMutation.isPending}
          onSave={() => void handleSave()}
          onCancel={handleCancel}
          onDelete={handleDelete}
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
