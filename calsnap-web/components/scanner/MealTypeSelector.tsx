import type { MealType } from '@/lib/models/meal-type';
import { suggestedMealTypeForDate } from '@/lib/models/meal-type';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (value: MealType) => void;
}

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const suggested = suggestedMealTypeForDate(new Date());

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Meal type</h3>
        <span className="text-xs text-neutral-500">Suggested: {LABELS[suggested]}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((type) => {
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-700'
              }`}
            >
              {LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
