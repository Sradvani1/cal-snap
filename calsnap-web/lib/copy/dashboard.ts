export const dashboardCopy = {
  'dashboard.greeting.today': 'Today',
  'dashboard.greeting.morning': 'Good morning, {{name}}',
  'dashboard.greeting.afternoon': 'Good afternoon, {{name}}',
  'dashboard.greeting.evening': 'Good evening, {{name}}',
  'dashboard.greeting.hello': 'Hello, {{name}}',
  'dashboard.error.profileLoad': 'Could not load your profile.',
  'dashboard.error.loadFailed': 'Failed to load dashboard',
  'dashboard.macros.title': 'Macros',
  'dashboard.meals.title': "Today's Meals",
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
