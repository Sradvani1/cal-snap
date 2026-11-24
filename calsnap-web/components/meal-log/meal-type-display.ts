import type { MealType } from '@/lib/models/meal-type';

export { MEAL_TYPE_LABELS } from '@/lib/meal-log/meal-type-labels';

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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
