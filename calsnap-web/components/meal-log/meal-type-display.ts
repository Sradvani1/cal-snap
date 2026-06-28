import { copy } from '@/lib/copy';
import type { MealType } from '@/lib/models/meal-type';

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: copy('common.mealType.breakfast'),
  lunch: copy('common.mealType.lunch'),
  dinner: copy('common.mealType.dinner'),
  snack: copy('common.mealType.snack'),
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export function formatMealTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
