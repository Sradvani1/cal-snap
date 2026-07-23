'use client';

import { AppDialog } from '@/components/design/AppDialog';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import {
  MEAL_TYPE_LABELS,
} from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { cn } from '@/lib/utils/cn';

interface FavoriteDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favorite: FavoriteMeal | null;
  isLogging: boolean;
  onLog: () => void;
  errorMessage?: string | null;
}

export function FavoriteDetailSheet({
  open,
  onOpenChange,
  favorite,
  isLogging,
  onLog,
  errorMessage,
}: FavoriteDetailSheetProps) {
  if (!favorite) return null;

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={favorite.name}
    >
      <p className={cn(typography.csCaption)}>
        {MEAL_TYPE_LABELS[favorite.mealType]}
      </p>

      <div className="mt-4 space-y-2">
        <p className={cn(typography.csCaption)}>{copy('scanner.result.items')}</p>
        {favorite.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-cs-muted/10 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-cs-foreground">
                {item.name}
              </p>
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
          value={`${Math.round(favorite.totalProteinG)}${copy('common.macro.grams')}`}
        />
        <MacroPill
          label={copy('common.macro.carbs')}
          value={`${Math.round(favorite.totalCarbsG)}${copy('common.macro.grams')}`}
        />
        <MacroPill
          label={copy('common.macro.fat')}
          value={`${Math.round(favorite.totalFatG)}${copy('common.macro.grams')}`}
        />
      </div>

      <div className="mt-6 space-y-3">
        {errorMessage && (
          <p className="text-center text-sm text-cs-danger" role="alert">
            {errorMessage}
          </p>
        )}

        <PrimaryButton
          fullWidth
          disabled={isLogging}
          onClick={onLog}
          className="min-h-11"
        >
          {isLogging
            ? copy('mealLog.favorites.logging')
            : copy('mealLog.favorites.logAction')}
        </PrimaryButton>

        <SecondaryButton
          fullWidth
          onClick={() => onOpenChange(false)}
          className="min-h-11"
        >
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
      <p className="text-sm font-semibold tabular-nums text-cs-foreground">
        {value}
      </p>
    </div>
  );
}
