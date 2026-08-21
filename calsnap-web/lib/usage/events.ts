export const UsageEvent = {
  AppOpened: 'app_opened',
  DashboardViewed: 'dashboard_viewed',
  LogViewed: 'log_viewed',
  ScanViewed: 'scan_viewed',
  ProgressViewed: 'progress_viewed',
  AnalyticsViewed: 'analytics_viewed',
  SettingsViewed: 'settings_viewed',
  OnboardingCompleted: 'onboarding_completed',
  MealSaved: 'meal_saved',
  WeighInSaved: 'weigh_in_saved',
  ScanRequested: 'scan_requested',
  ScanSucceeded: 'scan_succeeded',
  ScanFailed: 'scan_failed',
} as const;

export type UsageEventName = (typeof UsageEvent)[keyof typeof UsageEvent];

const usageEventNames = new Set<string>(Object.values(UsageEvent));

export function isUsageEventName(value: unknown): value is UsageEventName {
  return typeof value === 'string' && usageEventNames.has(value);
}
