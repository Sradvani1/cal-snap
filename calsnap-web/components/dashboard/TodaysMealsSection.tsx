import type { MealsByType } from '@/lib/dashboard/aggregate-meals';
import { MealListSection } from '@/components/meal-log/MealListSection';

interface TodaysMealsSectionProps {
  mealsByType: MealsByType;
}

export function TodaysMealsSection({ mealsByType }: TodaysMealsSectionProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Today&apos;s Meals</h2>
      <MealListSection mealsByType={mealsByType} />
    </div>
  );
}

export function TodaysMealsSectionSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-neutral-100" />
      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div key={row} className="h-10 animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
