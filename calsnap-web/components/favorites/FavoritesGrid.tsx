'use client';

import { FavoriteMealRow } from '@/components/favorites/FavoriteMealRow';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { Skeleton } from '@/components/design/Skeleton';
import { copy } from '@/lib/copy';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';

interface FavoritesGridProps {
  favorites: FavoriteMeal[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onUse: (favorite: FavoriteMeal) => void;
}

export function FavoritesGrid({
  favorites,
  isLoading,
  isError,
  onUse,
}: FavoritesGridProps) {
  if (isError) {
    return (
      <p className="text-center text-sm text-cs-danger">
        {copy('mealLog.favorites.errorLoad')}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <EmptyStateView
        icon="⭐"
        titleKey="mealLog.favorites.empty"
        messageKey="mealLog.favorites.emptySubtitle"
      />
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map((fav) => (
        <FavoriteMealRow
          key={fav.id}
          favorite={fav}
          onUse={() => onUse(fav)}
        />
      ))}
    </div>
  );
}
