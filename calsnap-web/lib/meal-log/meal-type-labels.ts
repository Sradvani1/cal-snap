import { copy } from '@/lib/copy';
import type { MealType } from '@/lib/models/meal-type';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: copy('common.mealType.breakfast'),
  lunch: copy('common.mealType.lunch'),
  dinner: copy('common.mealType.dinner'),
  snack: copy('common.mealType.snack'),
};
