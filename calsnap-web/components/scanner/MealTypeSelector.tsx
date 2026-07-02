import type { MealType } from '@/lib/models/meal-type';
import { suggestedMealTypeForDate } from '@/lib/models/meal-type';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const suggested = suggestedMealTypeForDate(new Date());

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.mealType.title')}</h3>
        <span className={typography.csCaption}>
          {copy('scanner.mealType.suggested', { type: MEAL_TYPE_LABELS[suggested] })}
        </span>
      </div>
      <div role="radiogroup" aria-label={copy('scanner.mealType.title')} className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((type) => {
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={cn(
                'min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                formFieldFocusRingClassName,
                active
                  ? 'bg-cs-foreground text-cs-surface'
                  : 'border border-cs-border bg-cs-surface text-cs-foreground',
              )}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
