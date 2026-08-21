export const usageCopy = {
  'usage.title': 'Usage overview',
  'usage.subtitle': 'Aggregate product activity. No user content or personal health data is shown.',
  'usage.error.forbidden': 'This account is not authorized to view usage analytics.',
  'usage.error.loadFailed': 'Usage analytics could not be loaded.',
  'usage.metric.activeUsers': 'Active-user days',
  'usage.metric.scans': 'Scan requests',
  'usage.metric.meals': 'Meals saved',
  'usage.metric.weighIns': 'Weigh-ins saved',
  'usage.table.title': 'Daily activity',
  'usage.table.date': 'Date',
  'usage.table.activeUsers': 'Active users',
  'usage.table.scans': 'Scans',
  'usage.table.meals': 'Meals',
  'usage.table.weighIns': 'Weigh-ins',
  'usage.empty': 'No usage data has been recorded yet.',
} as const;

export type UsageCopyKey = keyof typeof usageCopy;
