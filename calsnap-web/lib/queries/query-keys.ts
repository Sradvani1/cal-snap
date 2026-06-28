export const queryKeys = {
  profile: (uid: string) => ['profile', uid] as const,
  todaysMeals: (uid: string, dayKey: string) => ['todaysMeals', uid, dayKey] as const,
  weighIns: (uid: string, windowKey: string) => ['weighIns', uid, windowKey] as const,
};
