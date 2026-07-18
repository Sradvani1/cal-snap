export const dashboardCopy = {
  'dashboard.greeting.today': 'Today',
  'dashboard.greeting.morning': 'Good morning, {{name}}',
  'dashboard.greeting.afternoon': 'Good afternoon, {{name}}',
  'dashboard.greeting.evening': 'Good evening, {{name}}',
  'dashboard.greeting.hello': 'Hello, {{name}}',
  'dashboard.error.profileLoad': 'Could not load your profile.',
  'dashboard.error.loadFailed': 'Failed to load dashboard',
  'dashboard.macros.title': 'Macros',
  'dashboard.summary.title': 'Daily summary',
  'dashboard.summary.netCalories': 'Net calories',
  'dashboard.summary.netOver': '+{{delta}} over goal',
  'dashboard.summary.netUnder': '{{delta}} under goal',
  'dashboard.summary.netOnTarget': 'On target',
  'dashboard.summary.macroSplit':
    'Actual P/C/F: {{actualProtein}}/{{actualCarbs}}/{{actualFat}}% · Target: {{targetProtein}}/{{targetCarbs}}/{{targetFat}}%',
  'dashboard.summary.macroSplitA11y':
    'Actual macros protein {{actualProtein}} percent, carbs {{actualCarbs}} percent, fat {{actualFat}} percent. Target protein {{targetProtein}} percent, carbs {{targetCarbs}} percent, fat {{targetFat}} percent.',
  'dashboard.meals.title': "Today's Meals",
  'dashboard.weight.title': 'Weight Trend',
  'dashboard.weight.logWeighIn': 'Log weigh-in',
  'dashboard.weight.startingWeight': 'Starting weight',
  'dashboard.weight.firstWeighIn': 'Log your first weigh-in',
  'dashboard.weight.oneWeighIn': 'Log another weigh-in to see your trend',
  'dashboard.weight.logInProgress': 'Log weigh-in in Progress',
  'dashboard.weight.goalLine': 'Goal',
  'dashboard.weight.range': '{{start}} – {{end}}',
  'dashboard.weight.trendA11y': 'Weight trend from {{start}} to {{end}}',
  'dashboard.plateau.title': 'Plateau Detected',
  'dashboard.plateau.body':
    'Your weight has been stable for about three weeks. This can happen during a deficit.',
  'dashboard.plateau.dietBreak.title': 'Diet Break',
  'dashboard.plateau.dietBreak.description':
    'Eat at maintenance for 2 weeks to reset adaptation',
  'dashboard.plateau.smallReduction.title': 'Small Reduction',
  'dashboard.plateau.smallReduction.description': 'Reduce daily target by 60 kcal',
  'dashboard.plateau.remindLater': 'Remind Me Later',
  'dashboard.plateau.error.saveFailed': 'Failed to save profile',
  'dashboard.reminder.title': 'Time for a weigh-in',
  'dashboard.reminder.body':
    'It has been at least a week since your last weigh-in. Log your weight to keep your targets accurate.',
  'dashboard.reminder.logNow': 'Log now',
  'dashboard.reminder.remindTomorrow': 'Remind me tomorrow',
} as const;

export type DashboardCopyKey = keyof typeof dashboardCopy;
