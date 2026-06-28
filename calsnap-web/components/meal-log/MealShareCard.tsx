import type { MealType } from '@/lib/models/meal-type';
import { MEAL_TYPE_ICONS, MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

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
      <p className={cn(typography.csCaption, 'font-semibold')}>{label}</p>
      <p className={cn(typography.csBody, 'font-medium tabular-nums')}>
        {Math.round(grams)}
        {copy('common.macro.grams')}
      </p>
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
    <div className="w-[320px] rounded-2xl border border-cs-border bg-cs-surface p-6 text-cs-foreground">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden>{MEAL_TYPE_ICONS[mealType]}</span>
          <span className={cn(typography.csCardTitle, 'text-base')}>{MEAL_TYPE_LABELS[mealType]}</span>
        </div>
        <span className={cn(typography.csCaption, 'font-semibold')}>{copy('common.brand.calsnap')}</span>
      </div>

      <p className="text-5xl font-bold tabular-nums">{totalCalories}</p>
      <p className={cn(typography.csCardTitle, 'mb-4 text-lg text-cs-muted')}>
        {copy('common.macro.kcal')}
      </p>

      <div className="mb-4 flex gap-4">
        <MacroLabel label={copy('common.macro.protein').slice(0, 1)} grams={proteinG} />
        <MacroLabel label={copy('common.macro.carbs').slice(0, 1)} grams={carbsG} />
        <MacroLabel label={copy('common.macro.fat').slice(0, 1)} grams={fatG} />
      </div>

      <p className={typography.csCaption}>
        {timestamp.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  );
}
