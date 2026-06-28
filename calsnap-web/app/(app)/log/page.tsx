'use client';

import { useAuth } from '@/lib/auth/use-auth';
import { aggregateTodaysMeals } from '@/lib/dashboard/aggregate-meals';
import { dashboardFormattedDate } from '@/lib/dashboard/greeting';
import { useDeleteMeal } from '@/lib/queries/use-delete-meal';
import { useTodaysMeals } from '@/lib/queries/use-todays-meals';
import { MealListSection } from '@/components/meal-log/MealListSection';

export default function LogPage() {
  const { user } = useAuth();
  const now = new Date();
  const mealsQuery = useTodaysMeals(user?.uid, now);
  const deleteMealMutation = useDeleteMeal(user?.uid);

  const aggregation = aggregateTodaysMeals(mealsQuery.data ?? []);
  const hasMeals = (mealsQuery.data?.length ?? 0) > 0;

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm('Delete this meal? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      await deleteMealMutation.mutateAsync(mealId);
    } catch {
      // error shown via deleteMealMutation.error below
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Today&apos;s Log</h1>
        <p className="text-sm text-neutral-500">{dashboardFormattedDate(now)}</p>
      </header>

      {mealsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : !hasMeals ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-neutral-600">No meals logged today.</p>
          <p className="mt-2 text-sm text-neutral-500">
            Scan a meal to start your log.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <MealListSection
            mealsByType={aggregation.mealsByType}
            showRowActions
            onDeleteMeal={(mealId) => void handleDeleteMeal(mealId)}
          />
        </div>
      )}

      {deleteMealMutation.isError && (
        <p className="mt-3 text-sm text-red-600">
          {deleteMealMutation.error instanceof Error
            ? deleteMealMutation.error.message
            : 'Failed to delete meal. Try again.'}
        </p>
      )}
    </div>
  );
}
