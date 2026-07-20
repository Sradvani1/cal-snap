export const queryKeys = {
  profile: (uid: string) => ['profile', uid] as const,
  todaysMeals: (uid: string, dayKey: string) => ['todaysMeals', uid, dayKey] as const,
  meal: (uid: string, mealId: string) => ['meal', uid, mealId] as const,
  weighIns: (uid: string, windowKey: string) => ['weighIns', uid, windowKey] as const,
  allWeighIns: (uid: string) => ['allWeighIns', uid] as const,
  analyticsMeals: (uid: string, rangeKey: string) =>
    ['analyticsMeals', uid, rangeKey] as const,
  favorites: (uid: string) => ['favorites', uid] as const,
};
