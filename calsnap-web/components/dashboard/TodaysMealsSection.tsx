import type { MealEntry } from '@/lib/models/meal-entry';
import { MealType, type MealType as MealTypeValue } from '@/lib/models/meal-type';
import type { MealsByType } from '@/lib/dashboard/aggregate-meals';

const MEAL_TYPE_ORDER: MealTypeValue[] = [
  MealType.breakfast,
  MealType.lunch,
  MealType.dinner,
  MealType.snack,
];

const MEAL_TYPE_LABELS: Record<MealTypeValue, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_TYPE_ICONS: Record<MealTypeValue, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

function formatMealTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MealRow({ meal }: { meal: MealEntry }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span aria-hidden>{MEAL_TYPE_ICONS[meal.mealType]}</span>
        <span className="text-sm text-neutral-600">{formatMealTime(meal.timestamp)}</span>
      </div>
      <span className="text-sm font-medium tabular-nums text-neutral-900">
        {meal.totalCalories} kcal
      </span>
    </div>
  );
}

interface TodaysMealsSectionProps {
  mealsByType: MealsByType;
}

export function TodaysMealsSection({ mealsByType }: TodaysMealsSectionProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Today&apos;s Meals</h2>
      <div className="space-y-4">
        {MEAL_TYPE_ORDER.map((mealType) => {
          const meals = mealsByType[mealType] ?? [];
          return (
            <div key={mealType}>
              <h3 className="mb-2 text-sm font-semibold text-neutral-500">
                {MEAL_TYPE_LABELS[mealType]}
              </h3>
              {meals.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  No {MEAL_TYPE_LABELS[mealType].toLowerCase()} logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <MealRow key={meal.id} meal={meal} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
