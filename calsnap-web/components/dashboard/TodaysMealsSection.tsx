import { SectionCard } from '@/components/design/SectionCard';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealsByType } from '@/lib/dashboard/aggregate-meals';
import { MealListSection } from '@/components/meal-log/MealListSection';
import { copy } from '@/lib/copy';

interface TodaysMealsSectionProps {
  mealsByType: MealsByType;
  onDeleteFromSheet?: (meal: MealEntry) => void;
  onFavorite?: (meal: MealEntry) => void;
  favoritesData?: FavoriteMeal[];
}

export function TodaysMealsSection({ mealsByType, onDeleteFromSheet, onFavorite, favoritesData }: TodaysMealsSectionProps) {
  return (
    <SectionCard title={copy('dashboard.meals.title')}>
      <MealListSection mealsByType={mealsByType} onDeleteFromSheet={onDeleteFromSheet} onFavorite={onFavorite} favoritesData={favoritesData} />
    </SectionCard>
  );
}

export function TodaysMealsSectionSkeleton() {
  return (
    <SectionCard>
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-cs-muted/20" />
      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div key={row} className="h-10 animate-pulse rounded bg-cs-muted/20" />
        ))}
      </div>
    </SectionCard>
  );
}
