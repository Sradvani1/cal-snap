import { copy } from '@/lib/copy';
import { MEAL_TYPE_LABELS } from '@/lib/meal-log/meal-type-labels';
import type { MealType } from '@/lib/models/meal-type';

const MAX_PREVIEW_ITEMS = 4;
const MAX_DESCRIPTION_LENGTH = 160;

export function sharedMealPhotoStoragePath(ownerUid: string, shareId: string): string {
  return `sharedMeals/${ownerUid}/${shareId}/photo.jpg`;
}

export interface SharedMealSummaryInput {
  mealType: MealType;
  totalCalories: number;
  items: { name: string }[];
}

export function sharedMealSummary(meal: SharedMealSummaryInput): { title: string; description: string } {
  const names = meal.items.map((item) => item.name);
  const shown = names.slice(0, MAX_PREVIEW_ITEMS).join(', ');
  const remaining = names.length - MAX_PREVIEW_ITEMS;
  const description = remaining > 0 ? `${shown} +${remaining} more` : shown;

  return {
    title: `${MEAL_TYPE_LABELS[meal.mealType]} · ${Math.round(meal.totalCalories)} ${copy('common.macro.kcal')}`,
    description:
      description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
        : description,
  };
}
