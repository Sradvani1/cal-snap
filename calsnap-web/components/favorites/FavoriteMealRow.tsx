'use client';

import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { cn } from '@/lib/utils/cn';

const MEAL_BRIEF_LIMIT = 22;

function favoriteBrief(favorite: FavoriteMeal): string {
  const names = favorite.items.map((i) => i.name);
  if (names.length === 0) return copy('mealLog.row.empty');

  const suffix = names.length === 1 ? '' : ` +${names.length - 1}`;
  const first = names[0];

  if (first.length + suffix.length <= MEAL_BRIEF_LIMIT) {
    return first + suffix;
  }

  const words = first.split(' ');
  for (let i = words.length; i > 0; i--) {
    const candidate = words.slice(0, i).join(' ') + suffix;
    if (candidate.length <= MEAL_BRIEF_LIMIT) return candidate;
  }

  return suffix || '…';
}

interface FavoriteMealRowProps {
  favorite: FavoriteMeal;
  onUse: () => void;
}

export function FavoriteMealRow({ favorite, onUse }: FavoriteMealRowProps) {
  const brief = favoriteBrief(favorite);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUse}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUse(); }}
      className="flex cursor-pointer items-center justify-between rounded-lg bg-cs-muted/10 px-3 py-2 transition-colors hover:bg-cs-muted/15"
    >
      <span className={cn(typography.csCaption, 'min-w-0 truncate text-cs-foreground')}>
        {brief}
      </span>
      <span className={cn(typography.csCaption, 'font-medium tabular-nums shrink-0 text-cs-foreground')}>
        {Math.round(favorite.totalCalories)} {copy('common.macro.kcal')}
      </span>
    </div>
  );
}
