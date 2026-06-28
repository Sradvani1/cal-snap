import { SectionCard } from '@/components/design/SectionCard';
import type { MealsByType } from '@/lib/dashboard/aggregate-meals';
import { MealListSection } from '@/components/meal-log/MealListSection';
import { copy } from '@/lib/copy';

interface TodaysMealsSectionProps {
  mealsByType: MealsByType;
}

export function TodaysMealsSection({ mealsByType }: TodaysMealsSectionProps) {
  return (
    <SectionCard title={copy('dashboard.meals.title')}>
      <MealListSection mealsByType={mealsByType} />
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
