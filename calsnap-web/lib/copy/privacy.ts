export const privacyCopy = {
  'privacy.title': 'Privacy Policy',
  'privacy.lastUpdated': 'Last updated: June 2026',
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
  'privacy.section.session.title': 'Session cookies',
  'privacy.section.session.body':
    'After sign-in, CalSnap sets an HTTP-only __session cookie on this site (up to 5 days) to keep you logged in. The cookie is used only for authentication — not for advertising or third-party analytics.',
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
