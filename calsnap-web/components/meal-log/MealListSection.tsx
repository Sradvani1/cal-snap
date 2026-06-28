import Link from 'next/link';
import type { MealsByType } from '@/lib/dashboard/aggregate-meals';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
} from '@/components/meal-log/meal-type-display';
import { MealLogRow } from '@/components/meal-log/MealLogRow';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

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
            <h3 className={cn(typography.csCaption, 'mb-2 font-semibold')}>
              {MEAL_TYPE_LABELS[mealType]}
            </h3>
            {meals.length === 0 ? (
              <Link
                href="/scan"
                className={cn(
                  typography.csCaption,
                  'underline-offset-2 hover:text-cs-foreground hover:underline',
                )}
              >
                {copy('mealLog.addMeal', { mealType: MEAL_TYPE_LABELS[mealType] })}
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
