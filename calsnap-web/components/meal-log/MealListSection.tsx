import Link from 'next/link';
import type { MealsByType } from '@/lib/dashboard/aggregate-meals';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
} from '@/components/meal-log/meal-type-display';
import { MealLogRow } from '@/components/meal-log/MealLogRow';

interface MealListSectionProps {
  mealsByType: MealsByType;
  showRowActions?: boolean;
  onDeleteMeal?: (mealId: string) => void;
}

export function MealListSection({
  mealsByType,
  showRowActions = false,
  onDeleteMeal,
}: MealListSectionProps) {
  return (
    <div className="space-y-4">
      {MEAL_TYPE_ORDER.map((mealType) => {
        const meals = mealsByType[mealType] ?? [];
        return (
          <div key={mealType}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-500">
              {MEAL_TYPE_LABELS[mealType]}
            </h3>
            {meals.length === 0 ? (
              <Link
                href="/scan"
                className="block text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
              >
                Add {MEAL_TYPE_LABELS[mealType]}
              </Link>
            ) : (
              <div className="space-y-2">
                {meals.map((meal) => (
                  <MealLogRow
                    key={meal.id}
                    meal={meal}
                    showActions={showRowActions}
                    onDelete={onDeleteMeal}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
