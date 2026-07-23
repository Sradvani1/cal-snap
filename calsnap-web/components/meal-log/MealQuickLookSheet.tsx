'use client';

import { AppDialog } from '@/components/design/AppDialog';
import { SecondaryButton } from '@/components/design/PrimaryButton';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { MealEntry } from '@/lib/models/meal-entry';
import { cn } from '@/lib/utils/cn';

interface MealQuickLookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealEntry | null;
}

export function MealQuickLookSheet({ open, onOpenChange, meal }: MealQuickLookSheetProps) {
  if (!meal) return null;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange} title={MEAL_TYPE_LABELS[meal.mealType]}>
      <div className="mt-4 space-y-2">
        <p className={cn(typography.csCaption)}>{copy('scanner.result.items')}</p>
        {meal.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-cs-muted/10 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-cs-foreground">{item.name}</p>
              <p className={cn(typography.csCaption, 'tabular-nums')}>
                {Math.round(item.calories)} {copy('common.macro.kcal')}
              </p>
            </div>
            <span className={cn(typography.csCaption, 'tabular-nums')}>
              {Math.round(item.estimatedWeightG)}
              {copy('common.macro.grams')}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <MacroPill
          label={copy('common.macro.protein')}
          value={`${Math.round(meal.totalProteinG)}${copy('common.macro.grams')}`}
        />
        <MacroPill
          label={copy('common.macro.carbs')}
          value={`${Math.round(meal.totalCarbsG)}${copy('common.macro.grams')}`}
        />
        <MacroPill
          label={copy('common.macro.fat')}
          value={`${Math.round(meal.totalFatG)}${copy('common.macro.grams')}`}
        />
      </div>

      <div className="mt-6">
        <SecondaryButton fullWidth onClick={() => onOpenChange(false)} className="min-h-11">
          {copy('common.button.cancel')}
        </SecondaryButton>
      </div>
    </AppDialog>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-lg bg-cs-muted/10 px-3 py-2 text-center">
      <p className={cn(typography.csCaption, 'text-xs')}>{label}</p>
      <p className="text-sm font-semibold tabular-nums text-cs-foreground">{value}</p>
    </div>
  );
}
