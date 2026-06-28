import type { MealType } from '@/lib/models/meal-type';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';

export interface MealShareCardProps {
  mealType: MealType;
  timestamp: Date;
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function MacroLabel({ label, grams }: { label: string; grams: number }) {
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="text-sm font-medium tabular-nums text-neutral-900">{Math.round(grams)}g</p>
    </div>
  );
}

export function MealShareCard({
  mealType,
  timestamp,
  totalCalories,
  proteinG,
  carbsG,
  fatG,
}: MealShareCardProps) {
  return (
    <div className="w-[320px] rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden>{MEAL_TYPE_ICONS[mealType]}</span>
          <span className="text-base font-semibold">{MEAL_TYPE_LABELS[mealType]}</span>
        </div>
        <span className="text-xs font-semibold text-neutral-500">CalSnap</span>
      </div>

      <p className="text-5xl font-bold tabular-nums">{totalCalories}</p>
      <p className="mb-4 text-lg text-neutral-500">kcal</p>

      <div className="mb-4 flex gap-4">
        <MacroLabel label="P" grams={proteinG} />
        <MacroLabel label="C" grams={carbsG} />
        <MacroLabel label="F" grams={fatG} />
      </div>

      <p className="text-xs text-neutral-500">
        {timestamp.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  );
}
