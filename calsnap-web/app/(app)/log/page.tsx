'use client';

import { useCallback, useState } from 'react';
import { AppDialog } from '@/components/design/AppDialog';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { FavoriteDetailSheet } from '@/components/favorites/FavoriteDetailSheet';
import { FavoritesGrid } from '@/components/favorites/FavoritesGrid';
import { DailySummaryBar } from '@/components/meal-log/DailySummaryBar';
import { DateNavBar } from '@/components/meal-log/DateNavBar';
import { MealListSection } from '@/components/meal-log/MealListSection';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { layout } from '@/lib/design/layout';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { useDeleteFavorite } from '@/lib/queries/use-delete-favorite';
import { useFavorites } from '@/lib/queries/use-favorites';
import { useLogFromFavorite } from '@/lib/queries/use-log-from-favorite';
import { useSaveFavorite } from '@/lib/queries/use-save-favorite';
import { queryKeys } from '@/lib/queries/query-keys';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';
import { updateFavoriteName } from '@/lib/repositories/favorites';
import { cn } from '@/lib/utils/cn';
import { useQueryClient } from '@tanstack/react-query';

type Tab = 'log' | 'favorites';

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-cs-surface text-cs-foreground shadow-sm'
          : 'text-cs-muted hover:text-cs-foreground',
        formFieldFocusRingClassName,
      )}
    >
      {children}
    </button>
  );
}

export default function LogPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const [confirmText, setConfirmText] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mealsQuery = useTodaysMeals(user?.uid, selectedDate);
  const favoritesQuery = useFavorites(user?.uid);
  const saveFavoriteMutation = useSaveFavorite(user?.uid);
  const deleteFavoriteMutation = useDeleteFavorite(user?.uid);
  const logFromFavoriteMutation = useLogFromFavorite(user?.uid);
  const deleteMealMutation = useDeleteMeal(user?.uid);

  // Delete meal dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mealIdToDelete, setMealIdToDelete] = useState<string | null>(null);

  // Delete favorite dialog
  const [deleteFavDialogOpen, setDeleteFavDialogOpen] = useState(false);
  const [deleteFavTarget, setDeleteFavTarget] = useState<FavoriteMeal | null>(null);

  // Rename favorite dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFavTarget, setRenameFavTarget] = useState<FavoriteMeal | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Favorite detail sheet
  const [sheetFav, setSheetFav] = useState<FavoriteMeal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const aggregation = aggregateTodaysMeals(mealsQuery.data ?? []);
  const hasMeals = (mealsQuery.data?.length ?? 0) > 0;

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveTab('log');
    requestAnimationFrame(() =>
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' }),
    );
  }, []);

  const handleSaveFavorite = useCallback(
    (mealId: string) => {
      const meal = mealsQuery.data?.find((m) => m.id === mealId);
      if (!meal || !user) return;
      saveFavoriteMutation.mutate(meal);
    },
    [user, mealsQuery.data, saveFavoriteMutation],
  );

  const handleOpenSheet = useCallback((favorite: FavoriteMeal) => {
    setSheetFav(favorite);
    setSheetOpen(true);
  }, []);

  const handleLogFromSheet = useCallback(async () => {
    if (!sheetFav || !user) return;
    try {
      await logFromFavoriteMutation.mutateAsync(sheetFav);
      setSheetOpen(false);
      setSheetFav(null);
      setConfirmText(copy('mealLog.favorites.useConfirm', { name: sheetFav.name }));
      setTimeout(() => setConfirmText(null), 3000);
    } catch {
      // mutation error is surfaced via logFromFavoriteMutation.error
    }
  }, [sheetFav, user, logFromFavoriteMutation]);

  const handleDeleteMeal = useCallback((mealId: string) => {
    setMealIdToDelete(mealId);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDeleteMeal = useCallback(async () => {
    if (!mealIdToDelete) return;
    try {
      await deleteMealMutation.mutateAsync(mealIdToDelete);
    } finally {
      setMealIdToDelete(null);
      setDeleteDialogOpen(false);
    }
  }, [mealIdToDelete, deleteMealMutation]);

  const handleDeleteFavorite = useCallback((fav: FavoriteMeal) => {
    setDeleteFavTarget(fav);
    setDeleteFavDialogOpen(true);
  }, []);

  const handleConfirmDeleteFavorite = useCallback(async () => {
    if (!deleteFavTarget || !user) return;
    try {
      await deleteFavoriteMutation.mutateAsync(deleteFavTarget.id);
    } finally {
      setDeleteFavTarget(null);
      setDeleteFavDialogOpen(false);
    }
  }, [deleteFavTarget, user, deleteFavoriteMutation]);

  const handleOpenRename = useCallback((fav: FavoriteMeal) => {
    setRenameFavTarget(fav);
    setRenameValue(fav.name);
    setRenameDialogOpen(true);
  }, []);

  const handleConfirmRename = useCallback(async () => {
    if (!renameFavTarget || !renameValue.trim() || !user) return;
    try {
      await updateFavoriteName(user.uid, renameFavTarget.id, renameValue.trim());
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user.uid) });
    } finally {
      setRenameDialogOpen(false);
      setRenameFavTarget(null);
      setRenameValue('');
    }
  }, [renameFavTarget, renameValue, user, queryClient]);

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <div className={cn(activeTab !== 'log' && 'opacity-0 pointer-events-none')}>
        <DateNavBar date={selectedDate} onDateChange={handleDateChange} />
      </div>

      <div className="mb-4 mt-4 flex gap-0 rounded-lg bg-cs-muted/10 p-0.5">
        <TabButton active={activeTab === 'log'} onClick={() => setActiveTab('log')}>
          {copy('common.nav.log')}
        </TabButton>
        <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>
          {copy('mealLog.favorites.title')}
        </TabButton>
      </div>

      {activeTab === 'log' ? (
        <>
          {mealsQuery.isLoading ? (
            <SectionCardSkeleton />
          ) : !hasMeals ? (
            <EmptyStateView
              icon="🍽️"
              titleKey={isToday(selectedDate) ? 'mealLog.empty.title' : 'mealLog.empty.pastTitle'}
              messageKey={
                isToday(selectedDate)
                  ? 'mealLog.empty.subtitle'
                  : 'mealLog.empty.pastSubtitle'
              }
            />
          ) : (
            <SectionCard>
              <MealListSection
                mealsByType={aggregation.mealsByType}
                showAddButton={isToday(selectedDate)}
                showRowActions
                onDeleteMeal={handleDeleteMeal}
                onSaveFavorite={handleSaveFavorite}
              />
              <DailySummaryBar aggregation={aggregation} />
            </SectionCard>
          )}

          {deleteMealMutation.isError && (
            <p className="mt-3 text-sm text-cs-danger">{copy('mealLog.error.deleteFailed')}</p>
          )}
          {deleteFavoriteMutation.isError && (
            <p className="mt-3 text-sm text-cs-danger">{copy('mealLog.favorites.errorDelete')}</p>
          )}
        </>
      ) : (
        <FavoritesGrid
          favorites={favoritesQuery.data}
          isLoading={favoritesQuery.isLoading}
          isError={favoritesQuery.isError}
          confirmText={confirmText}
          onOpenDetail={handleOpenSheet}
          onDelete={handleDeleteFavorite}
          onRename={handleOpenRename}
        />
      )}

      <ConfirmAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={copy('mealLog.confirm.deleteTitle')}
        description={copy('mealLog.confirm.delete')}
        confirmLabel={copy('mealLog.confirm.deleteAction')}
        destructive
        onConfirm={() => void handleConfirmDeleteMeal()}
      />

      <ConfirmAlertDialog
        open={deleteFavDialogOpen}
        onOpenChange={setDeleteFavDialogOpen}
        title={copy('mealLog.favorites.deleteConfirm')}
        description={copy('mealLog.favorites.deleteDesc')}
        confirmLabel={copy('mealLog.favorites.deleteAction')}
        destructive
        onConfirm={() => void handleConfirmDeleteFavorite()}
      />

      <AppDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title={copy('mealLog.favorites.rename')}
      >
        <div className="space-y-4">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={copy('mealLog.favorites.renamePlaceholder')}
            className="w-full rounded-lg border border-cs-border bg-cs-background px-3 py-2 text-sm text-cs-foreground"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameDialogOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-cs-muted hover:text-cs-foreground"
            >
              {copy('common.button.cancel')}
            </button>
            <button
              type="button"
              disabled={!renameValue.trim()}
              onClick={handleConfirmRename}
              className="rounded-lg bg-cs-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {copy('common.button.save')}
            </button>
          </div>
        </div>
      </AppDialog>

      <FavoriteDetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSheetOpen(false);
            setSheetFav(null);
          }
        }}
        favorite={sheetFav}
        isLogging={logFromFavoriteMutation.isPending}
        onLog={() => void handleLogFromSheet()}
        errorMessage={logFromFavoriteMutation.isError ? copy('mealLog.favorites.errorUse') : null}
      />
    </div>
  );
}
