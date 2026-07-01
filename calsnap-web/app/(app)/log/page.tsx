'use client';

import { useState } from 'react';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { MealListSection } from '@/components/meal-log/MealListSection';
import { useAuth } from '@/lib/auth/auth-context';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { dashboardFormattedDate } from '@/lib/dashboard/greeting';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';

export default function LogPage() {
  const { user } = useAuth();
  const now = new Date();
  const mealsQuery = useTodaysMeals(user?.uid, now);
  const deleteMealMutation = useDeleteMeal(user?.uid);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mealIdToDelete, setMealIdToDelete] = useState<string | null>(null);

  const aggregation = aggregateTodaysMeals(mealsQuery.data ?? []);
  const hasMeals = (mealsQuery.data?.length ?? 0) > 0;

  const handleDeleteMeal = (mealId: string) => {
    setMealIdToDelete(mealId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mealIdToDelete) {
      return;
    }
    try {
      await deleteMealMutation.mutateAsync(mealIdToDelete);
    } catch {
      // error shown via deleteMealMutation.error below
    } finally {
      setMealIdToDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <header className="mb-6">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('mealLog.title')}</h1>
        <p className={typography.csCaption}>{dashboardFormattedDate(now)}</p>
      </header>

      {mealsQuery.isLoading ? (
        <SectionCardSkeleton />
      ) : !hasMeals ? (
        <EmptyStateView
          icon="🍽️"
          titleKey="mealLog.empty.title"
          messageKey="mealLog.empty.subtitle"
          actionTitleKey="mealLog.empty.action"
          actionHref="/scan"
        />
      ) : (
        <SectionCard>
          <MealListSection
            mealsByType={aggregation.mealsByType}
            showRowActions
            onDeleteMeal={handleDeleteMeal}
          />
        </SectionCard>
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
    </div>
  );
}
