export class MealNotFoundError extends Error {
  constructor(mealId: string) {
    super(`Meal not found: ${mealId}`);
    this.name = 'MealNotFoundError';
  }
}

export class MealDateOutOfRangeError extends Error {
  constructor() {
    super('Meal date is more than three days in the future.');
    this.name = 'MealDateOutOfRangeError';
  }
}
