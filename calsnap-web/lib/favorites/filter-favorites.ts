import type { FavoriteMeal } from '@/lib/models/favorite-meal';

/**
 * Case-insensitive substring match on the favorite name and its food item
 * names. An empty query returns the full list unchanged (order preserved).
 */
export function filterFavoriteMeals(favorites: FavoriteMeal[], query: string): FavoriteMeal[] {
  const q = query.trim().toLowerCase();
  if (!q) return favorites;
  return favorites.filter(
    (fav) =>
      fav.name.toLowerCase().includes(q) ||
      fav.items.some((item) => item.name.toLowerCase().includes(q)),
  );
}
