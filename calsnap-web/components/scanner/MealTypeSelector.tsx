import type { MealType } from '@/lib/models/meal-type';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
  compact?: boolean;
}

export function MealTypeSelector({ value, onChange, compact = false }: MealTypeSelectorProps) {
  return (
    <div>
      <div className="mb-2">
        <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.mealType.title')}</h3>
      </div>
      <div role="radiogroup" aria-label={copy('scanner.mealType.title')} className={cn('flex gap-2', compact && 'gap-1.5', !compact && 'flex-wrap')}>
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
                compact
                  ? 'flex-1 min-h-10 rounded-lg px-1 py-2 text-[13px] font-medium transition-colors'
                  : 'min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
