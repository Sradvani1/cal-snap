export const pwaCopy = {
  'pwa.install.title': 'Install CalSnap',
  'pwa.install.body.android': 'Add CalSnap to your home screen for quick access.',
  'pwa.install.body.ios':
    'Install CalSnap: tap Share, then Add to Home Screen for quick access.',
  'pwa.install.cta': 'Install',
  'pwa.install.dismiss': 'Not now',
} as const;

export type PwaCopyKey = keyof typeof pwaCopy;
