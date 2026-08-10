'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { FavoritesGrid } from '@/components/favorites/FavoritesGrid';
import { DailySummaryBar } from '@/components/meal-log/DailySummaryBar';
import { DateNavBar } from '@/components/meal-log/DateNavBar';
import { MealListSection } from '@/components/meal-log/MealListSection';
import { MealQuickLookSheet } from '@/components/meal-log/MealQuickLookSheet';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { localDayKey } from '@/lib/dashboard/date-window';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { layout } from '@/lib/design/layout';
import type { FoodItem } from '@/lib/models/food-item';
import type { MealType } from '@/lib/models/meal-type';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { useDeleteFavorite } from '@/lib/queries/use-delete-favorite';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useFavorites } from '@/lib/queries/use-favorites';
import { invalidateAnalyticsQueries } from '@/lib/queries/invalidate-analytics';
import { useSaveFavorite } from '@/lib/queries/use-save-favorite';
import { queryKeys } from '@/lib/queries/query-keys';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';
import { createMeal } from '@/lib/repositories/meals';
import { logFavorite } from '@/lib/repositories/favorites';
import { cn } from '@/lib/utils/cn';
import { useQueryClient } from '@tanstack/react-query';

type Tab = 'favorites' | 'history';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-cs-surface text-cs-foreground shadow-sm' : 'text-cs-muted hover:text-cs-foreground',
        formFieldFocusRingClassName,
      )}
    >
      {children}
    </button>
  );
}

function mealEntryFromItems(userId: string, items: FoodItem[], mealType: MealType, date: Date): MealEntry {
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.proteinG,
      carbs: acc.carbs + item.carbsG,
      fat: acc.fat + item.fatG,
      sat: acc.sat + (item.saturatedFatG ?? 0),
      unsat: acc.unsat + (item.unsaturatedFatG ?? 0),
      fiber: acc.fiber + item.fiberG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sat: 0, unsat: 0, fiber: 0 },
  );
  return {
    id: crypto.randomUUID(),
    userId,
    timestamp: date,
    mealType,
    totalCalories: totals.calories,
    totalProteinG: totals.protein,
    totalCarbsG: totals.carbs,
    totalFatG: totals.fat,
    totalSaturatedFatG: totals.sat,
    totalUnsaturatedFatG: totals.unsat,
    totalFiberG: totals.fiber,
    geminiConfidence: 0,
    isManuallyAdjusted: true,
    items: items.map((i) => ({ ...i, id: crypto.randomUUID() })),
  };
}

function LogPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const dateParam = searchParams.get('date');
    return dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? 'history' : 'favorites';
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
    return new Date();
  });

  const queryClient = useQueryClient();
  const mealsQuery = useTodaysMeals(user?.uid, selectedDate);
  const favoritesQuery = useFavorites(user?.uid);
  const saveFavoriteMutation = useSaveFavorite(user?.uid);
  const deleteFavoriteMutation = useDeleteFavorite(user?.uid);
  const deleteMealMutation = useDeleteMeal(user?.uid);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  type SheetData = { meal: MealEntry; context: 'favorites' | 'history'; favoriteId?: string } | null;
  const [sheetData, setSheetData] = useState<SheetData>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  // Delete favorite dialog
  const [deleteFavDialogOpen, setDeleteFavDialogOpen] = useState(false);
  const [deleteFavTarget, setDeleteFavTarget] = useState<FavoriteMeal | null>(null);

  // Delete meal dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mealIdToDelete, setMealIdToDelete] = useState<string | null>(null);

  const aggregation = aggregateTodaysMeals(mealsQuery.data ?? []);
  const hasMeals = (mealsQuery.data?.length ?? 0) > 0;

  // --- Sheet handlers ---

  const openSheetForFavorite = useCallback((fav: FavoriteMeal, context: 'favorites' | 'history') => {
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      userId: fav.userId,
      timestamp: new Date(),
      mealType: fav.mealType,
      totalCalories: fav.totalCalories,
      totalProteinG: fav.totalProteinG,
      totalCarbsG: fav.totalCarbsG,
      totalFatG: fav.totalFatG,
      totalSaturatedFatG: fav.items.reduce((s, i) => s + (i.saturatedFatG ?? 0), 0),
      totalUnsaturatedFatG: fav.items.reduce((s, i) => s + (i.unsaturatedFatG ?? 0), 0),
      totalFiberG: fav.totalFiberG,
      geminiConfidence: 0,
      isManuallyAdjusted: true,
      items: fav.items.map((i) => ({ ...i })),
    };
    setSheetError(null);
    setSheetData({ meal: entry, context, favoriteId: fav.id });
    setSheetOpen(true);
  }, []);

  const openSheetForHistory = useCallback((meal: MealEntry) => {
    setSheetError(null);
    setSheetData({ meal, context: 'history' });
    setSheetOpen(true);
  }, []);

  const handleSheetLog = useCallback(
    async (items: FoodItem[], mealType: MealType) => {
      if (!user) return;
      const favId = sheetData?.favoriteId;
      setIsLogging(true);
      try {
        const entry = mealEntryFromItems(user.uid, items, mealType, new Date());
        try {
          await createMeal(entry);
        } catch (error) {
          setSheetError(copy('mealLog.sheet.error.logFailed'));
          throw error;
        }

        const dayKey = localDayKey(entry.timestamp);
        void queryClient.invalidateQueries({ queryKey: queryKeys.todaysMeals(user.uid, dayKey) });
        invalidateAnalyticsQueries(queryClient, user.uid);
        if (favId) {
          try {
            await logFavorite(user.uid, favId);
            void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user.uid) });
          } catch (error) {
            console.warn('Meal saved but favorite usage update failed:', error);
          }
        }
        router.push('/dashboard');
      } finally {
        setIsLogging(false);
      }
    },
    [user, queryClient, sheetData, router],
  );

  const handleSheetFavorite = useCallback(async () => {
    if (
      !user ||
      !sheetData ||
      saveFavoriteMutation.isPending ||
      deleteFavoriteMutation.isPending
    ) return false;
    setSheetError(null);
    try {
      const mealId = sheetData.meal.id;
      const existingFav = favoritesQuery.data?.find((f) => f.originalMealId === mealId);
      if (existingFav) {
        await deleteFavoriteMutation.mutateAsync(existingFav.id);
      } else {
        const favEntry: MealEntry = {
          ...sheetData.meal,
          geminiConfidence: 0,
          isManuallyAdjusted: true,
        };
        await saveFavoriteMutation.mutateAsync(favEntry);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user.uid) });
      return true;
    } catch {
      setSheetError(copy('mealLog.favorites.errorSave'));
      return false;
    }
  }, [user, sheetData, saveFavoriteMutation, deleteFavoriteMutation, favoritesQuery.data, queryClient]);

  const handleSheetDeleteMeal = useCallback((meal: MealEntry) => {
    if (!user) return;
    if (sheetData?.context === 'favorites' && sheetData.favoriteId) {
      setDeleteFavTarget({ id: sheetData.favoriteId } as FavoriteMeal);
      setDeleteFavDialogOpen(true);
    } else if (sheetData?.context === 'history') {
      setMealIdToDelete(meal.id);
      setDeleteDialogOpen(true);
    }
  }, [user, sheetData]);

  const handleConfirmDeleteMeal = useCallback(async () => {
    if (!mealIdToDelete) return;
    try {
      await deleteMealMutation.mutateAsync(mealIdToDelete);
    } finally {
      setMealIdToDelete(null);
      setDeleteDialogOpen(false);
    }
  }, [mealIdToDelete, deleteMealMutation]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveTab('history');
  }, []);

  // --- Favorite operations ---

  const handleConfirmDeleteFavorite = useCallback(async () => {
    if (!deleteFavTarget || !user) return;
    try {
      await deleteFavoriteMutation.mutateAsync(deleteFavTarget.id);
    } finally {
      setDeleteFavTarget(null);
      setDeleteFavDialogOpen(false);
    }
  }, [deleteFavTarget, user, deleteFavoriteMutation]);

  const favorites = favoritesQuery.data ?? [];

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      {/* Tab switcher */}
      <div className="mb-4 flex gap-0 rounded-lg bg-cs-muted/10 p-0.5">
        <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')}>
          Favorites
        </TabButton>
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          {copy('common.nav.log')}
        </TabButton>
      </div>

      {/* Favorites tab */}
      {activeTab === 'favorites' && (
        <SectionCard title={copy('mealLog.favorites.title')}>
          <FavoritesGrid
            favorites={favorites}
            isLoading={favoritesQuery.isLoading}
            isError={favoritesQuery.isError}
            onUse={(fav) => openSheetForFavorite(fav, 'favorites')}
          />
        </SectionCard>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <>
          <div className="mb-4">
            <DateNavBar date={selectedDate} onDateChange={handleDateChange} />
          </div>
          {mealsQuery.isLoading ? (
            <SectionCardSkeleton />
          ) : mealsQuery.isError ? (
            <EmptyStateView
              icon="⚠️"
              titleKey="mealLog.error.loadTitle"
              messageKey="mealLog.error.loadMessage"
            />
          ) : (
            <SectionCard className="overflow-hidden">
              <MealListSection
                mealsByType={aggregation.mealsByType}
                showAddButton
                dateKey={localDayKey(selectedDate)}
                showRowActions={false}
                onOpenSheet={openSheetForHistory}
              />
              {hasMeals && <DailySummaryBar aggregation={aggregation} />}
            </SectionCard>
          )}
        </>
      )}

      {/* Error messages */}
      {deleteFavoriteMutation.isError && (
        <p className="mt-3 text-sm text-cs-danger">{copy('mealLog.favorites.errorDelete')}</p>
      )}

      {/* MealQuickLookSheet (shared for both Favorites and History) */}
      {sheetData && (
        <MealQuickLookSheet
          key={sheetData.meal.id}
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSheetOpen(false);
              setSheetData(null);
              setSheetError(null);
            }
          }}
          meal={sheetData.meal}
          skipAutoSave={sheetData.context === 'favorites'}
          onLog={sheetData.context === 'favorites' ? handleSheetLog : undefined}
          isLogging={isLogging}
          onFavorite={sheetData.context === 'favorites' ? undefined : handleSheetFavorite}
          isFavoritePending={saveFavoriteMutation.isPending || deleteFavoriteMutation.isPending}
          error={sheetError}
          onDeleteMeal={handleSheetDeleteMeal}
          viewHref={sheetData.context === 'history' ? `/log/${sheetData.meal.id}` : undefined}
          hideMealType={sheetData.context !== 'favorites'}
          isFavorited={
            sheetData.context === 'history'
              ? (favoritesQuery.data?.some((f) => f.originalMealId === sheetData.meal.id) ?? false)
              : false
          }
        />
      )}

      {/* Delete favorite dialog */}
      <ConfirmAlertDialog
        open={deleteFavDialogOpen}
        onOpenChange={setDeleteFavDialogOpen}
        title={copy('mealLog.favorites.deleteConfirm')}
        description={copy('mealLog.favorites.deleteDesc')}
        confirmLabel={copy('mealLog.favorites.deleteAction')}
        destructive
        onConfirm={() => void handleConfirmDeleteFavorite()}
      />

      {/* Delete meal dialog */}
      <ConfirmAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={copy('mealLog.confirm.deleteTitle')}
        description={copy('mealLog.confirm.delete')}
        confirmLabel={copy('mealLog.confirm.deleteAction')}
        destructive
        onConfirm={() => void handleConfirmDeleteMeal()}
      />
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogPageContent />
    </Suspense>
  );
}
