import Link from 'next/link';
import type { MealType } from '@/lib/models/meal-type';
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
  showAddButton?: boolean;
  showRowActions?: boolean;
  onDeleteMeal?: (mealId: string) => void;
}

function AddMealLink({ mealType }: { mealType: MealType }) {
  return (
    <Link
      href={`/scan?mealType=${mealType}`}
      className={cn(
        typography.csCaption,
        'underline underline-offset-2 hover:text-cs-foreground',
      )}
    >
      {copy('mealLog.addMeal', { mealType: MEAL_TYPE_LABELS[mealType] })}
    </Link>
  );
}

export function MealListSection({
  mealsByType,
  showAddButton = true,
  showRowActions = false,
  onDeleteMeal,
}: MealListSectionProps) {
  return (
    <div className="space-y-4">
      {MEAL_TYPE_ORDER.map((mealType) => {
        const meals = mealsByType[mealType] ?? [];
        return (
          <div key={mealType}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className={cn(typography.csCaption, 'font-semibold')}>
                {MEAL_TYPE_LABELS[mealType]}
              </h3>
              {showAddButton && (
                <Link
                  href={`/scan?mealType=${mealType}`}
                  aria-label={copy('mealLog.addMeal', { mealType: MEAL_TYPE_LABELS[mealType] })}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-cs-muted hover:bg-cs-muted/15 hover:text-cs-foreground"
                >
                  +
                </Link>
              )}
            </div>
            {meals.length === 0 ? (
              showAddButton ? <AddMealLink mealType={mealType} /> : null
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
