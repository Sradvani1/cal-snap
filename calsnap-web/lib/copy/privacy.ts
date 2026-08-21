export const privacyCopy = {
  'privacy.title': 'Privacy Policy',
  'privacy.lastUpdated': 'Last updated: August 2026',
  'privacy.intro':
    'CalSnap Web helps you track calories and macros from meal photos. This policy describes what we collect, how we use it, and your choices.',
  'privacy.section.collected.title': 'Data we collect',
  'privacy.section.collected.body':
    'Account email from Firebase Authentication; profile metrics (age, height, weight, goals, activity level, macro targets); meal logs with nutrition totals; and meal photos you upload for scanning.',
  'privacy.section.ai.title': 'AI processing',
  'privacy.section.ai.body':
    'Meal photos and optional descriptions are sent to Google Gemini for analysis. Processing happens on our servers using an operator-managed API key. Gemini responses are parsed into food items and stored with your meal log.',
  'privacy.section.storage.title': 'Where data is stored',
  'privacy.section.storage.body':
    'Firebase Authentication (sign-in), Cloud Firestore (profile, meals, weigh-ins), and Firebase Storage (meal photos). Data is scoped to your account and protected by Firebase security rules.',
  'privacy.section.usage.title': 'Product usage measurement',
  'privacy.section.usage.body':
    'We collect limited first-party usage totals to understand which CalSnap features are used and whether scans succeed. This includes aggregate daily counts and short-lived pseudonymous daily identifiers used to count active users and protect the measurement from abuse. We do not include meal contents, photos, descriptions, profile data, weights, IP addresses, user agents, or advertising identifiers in these records. The pseudonymous identifier is retained for up to 36 days, and deleting your data does not change previously anonymized aggregate totals.',
  'privacy.section.notCollected.title': 'What we do not collect',
  'privacy.section.notCollected.body':
    'HealthKit data, precise location, advertising identifiers, or third-party tracking for ads. CalSnap Web does not sell your data.',
  'privacy.section.deletion.title': 'Deleting your data',
  'privacy.section.deletion.body':
    'In Settings → Your data → Delete all my data, you can permanently delete your meals, weigh-ins, profile, and photos. Your sign-in account is kept so you can start over from onboarding.',
  'privacy.section.contact.title': 'Contact',
  'privacy.section.contact.body':
    'Questions about privacy or data handling? Open an issue on our GitHub repository:',
  'privacy.section.contact.linkLabel': 'cal-snap issues on GitHub',
  'privacy.backHome': 'Back to CalSnap',
} as const;

export type PrivacyCopyKey = keyof typeof privacyCopy;

export const PRIVACY_GITHUB_ISSUES_URL =
  'https://github.com/Sradvani1/cal-snap/issues';
