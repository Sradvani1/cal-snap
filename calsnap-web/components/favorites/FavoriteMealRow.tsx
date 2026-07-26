'use client';

import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { cn } from '@/lib/utils/cn';

interface FavoriteMealRowProps {
  favorite: FavoriteMeal;
  onUse: () => void;
}

export function FavoriteMealRow({ favorite, onUse }: FavoriteMealRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUse}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUse(); }}
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-cs-muted/10 px-3 py-2 transition-colors hover:bg-cs-muted/15"
    >
      <div className="min-w-0 flex-1">
        <p className={cn(typography.csBody, 'font-medium truncate')}>{favorite.name}</p>
        <p className={cn(typography.csCaption, 'tabular-nums')}>
          {Math.round(favorite.totalCalories)} {copy('common.macro.kcal')}
          <span className="text-cs-muted">
            {' '}&middot; {copy('common.macro.protein')} {Math.round(favorite.totalProteinG)}{copy('common.macro.grams')}{' '}
            {copy('common.macro.carbs')} {Math.round(favorite.totalCarbsG)}{copy('common.macro.grams')}{' '}
            {copy('common.macro.fat')} {Math.round(favorite.totalFatG)}{copy('common.macro.grams')}
          </span>
        </p>
      </div>
    </div>
  );
}
