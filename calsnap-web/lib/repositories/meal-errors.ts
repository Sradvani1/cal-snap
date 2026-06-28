export class MealNotFoundError extends Error {
  constructor(mealId: string) {
    super(`Meal not found: ${mealId}`);
    this.name = 'MealNotFoundError';
  }
}
