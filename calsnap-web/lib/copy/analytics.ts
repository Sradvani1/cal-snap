export const analyticsCopy = {
  'analytics.title': 'Analytics',
  'analytics.timeframe.7d': '7D',
  'analytics.timeframe.30d': '30D',
  'analytics.timeframe.90d': '90D',
  'analytics.timeframe.custom': 'Custom',
  'analytics.timeframe.a11y': 'Analytics timeframe',
  'analytics.customRange.title': 'Custom range',
  'analytics.customRange.hint': 'Select up to 365 days.',
  'analytics.customRange.startDate': 'Start date',
  'analytics.customRange.endDate': 'End date',
  'analytics.customRange.apply': 'Apply',
  'analytics.empty.title': 'Log at least 3 days of meals',
  'analytics.empty.body':
    'Dietary charts and insights need a few days of meal history in your selected timeframe.',
  'analytics.empty.action': 'Scan a meal',
  'analytics.error.loadFailed': 'Failed to load analytics',
  'analytics.section.calorieAdherence': 'Caloric intake',
  'analytics.calorie.avgIntake': 'Average',
  'analytics.calorie.target': 'Target',
  'analytics.calorie.calories': 'Calories',
  'analytics.calorie.onTarget': 'On target',
  'analytics.calorie.a11y':
    'Calorie adherence: average {{avg}} kcal per day, target {{target}}, {{pct}}% of logged days on target',
  'analytics.section.macroTrends': 'Macro trends',
  'analytics.section.fiber': 'Fiber',
  'analytics.fiber.summary': '{{met}} of {{total}} logged days met fiber target',
  'analytics.macro.legendProtein': 'Protein',
  'analytics.macro.legendCarbs': 'Carbs',
  'analytics.macro.legendFat': 'Fat',
} as const;

export type AnalyticsCopyKey = keyof typeof analyticsCopy;
