/** 31 iOS designSystem.* keys from Localizable.xcstrings */
export const designSystemCopy = {
  'designSystem.calorieRing.accessibility.label': 'Calorie progress',
  'designSystem.calorieRing.accessibility.over': '{{over}} calories over {{target}} goal',
  'designSystem.calorieRing.accessibility.remaining':
    '{{remaining}} calories remaining of {{target}} goal',
  'designSystem.calorieRing.band.onTrack': 'On track',
  'designSystem.calorieRing.band.over': 'Over goal',
  'designSystem.calorieRing.band.under': 'Under goal',
  'designSystem.calorieRing.consumed': '{{consumed}} kcal consumed',
  'designSystem.calorieRing.ofGoal': 'of {{target}} kcal goal',
  'designSystem.calorieRing.over': 'over',
  'designSystem.calorieRing.remaining': 'remaining',
  'designSystem.confidence.accessibility': '{{level}}, {{percent}} percent',
  'designSystem.confidence.levelWithPercent': '{{level}} ({{percent}}%)',
  'designSystem.emptyState.actionHint': 'Primary action for this empty state',
  'designSystem.foodItem.accessibility.flagged': 'flagged for review',
  'designSystem.foodItem.accessibility.row': '{{name}}, {{calories}} calories',
  'designSystem.foodItem.editHint': 'Opens item editor',
  'designSystem.foodItem.flaggedAdjust': 'Adjust?',
  'designSystem.foodItem.macroSummary': 'P {{protein}}g · C {{carbs}}g · F {{fat}}g',
  'designSystem.foodItem.weightCalories': '{{weight}}g · {{calories}} kcal',
  'designSystem.macroBar.accessibility.summary':
    'Macros: protein {{protein}} grams, carbs {{carbs}} grams, fat {{fat}} grams, fiber {{fiber}} grams',
  'designSystem.macroBar.carbs': 'Carbs',
  'designSystem.macroBar.fat': 'Fat',
  'designSystem.macroBar.legendFormat': '{{label}} {{value}}g',
  'designSystem.macroBar.noData': 'No macro data',
  'designSystem.macroBar.protein': 'Protein',
  'designSystem.nutrient.calories': 'Calories',
  'designSystem.nutrient.caloriesValue': '{{calories}} kcal',
  'designSystem.nutrientStat.accessibility.basic': '{{label}}, {{value}}',
  'designSystem.nutrientStat.accessibility.withTarget': '{{label}}, {{value}}, target {{target}}',
  'designSystem.nutrientStat.target': 'Target {{target}}',
} as const;

export type DesignSystemCopyKey = keyof typeof designSystemCopy;
