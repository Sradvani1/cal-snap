const PWA_INSTALL_ELIGIBLE_PREFIX = 'pwaInstallEligible-';
const PWA_INSTALL_DISMISSED_PREFIX = 'pwaInstallDismissed-';

export function pwaInstallEligibleKey(uid: string): string {
  return `${PWA_INSTALL_ELIGIBLE_PREFIX}${uid}`;
}

export function pwaInstallDismissedKey(uid: string): string {
  return `${PWA_INSTALL_DISMISSED_PREFIX}${uid}`;
}

export function markPwaInstallEligible(uid: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(pwaInstallEligibleKey(uid), 'true');
}

export function consumePwaInstallEligible(uid: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const key = pwaInstallEligibleKey(uid);
  const eligible = window.localStorage.getItem(key) === 'true';
  if (eligible) {
    window.localStorage.removeItem(key);
  }
  return eligible;
}

const installBannerSession = {
  uid: null as string | null,
  eligible: false,
};

const installBannerListeners = new Set<() => void>();

function notifyInstallBannerListeners(): void {
  for (const listener of installBannerListeners) {
    listener();
  }
}

/** Cached per uid so useSyncExternalStore snapshots stay stable after first read. */
export function readInstallBannerEligible(uid: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (isStandaloneDisplayMode() || isPwaInstallDismissed(uid)) {
    installBannerSession.uid = uid;
    installBannerSession.eligible = false;
    return false;
  }
  if (installBannerSession.uid === uid) {
    return installBannerSession.eligible;
  }
  installBannerSession.uid = uid;
  installBannerSession.eligible = consumePwaInstallEligible(uid);
  return installBannerSession.eligible;
}

export function suppressInstallBanner(uid: string): void {
  if (installBannerSession.uid === uid) {
    installBannerSession.eligible = false;
  }
  notifyInstallBannerListeners();
}

export function subscribeInstallBanner(onStoreChange: () => void): () => void {
  installBannerListeners.add(onStoreChange);
  return () => {
    installBannerListeners.delete(onStoreChange);
  };
}

export function isPwaInstallDismissed(uid: string): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.localStorage.getItem(pwaInstallDismissedKey(uid)) === 'true';
}

export function dismissPwaInstall(uid: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(pwaInstallDismissedKey(uid), 'true');
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isBeforeInstallPromptEvent(
  event: Event,
): event is BeforeInstallPromptEvent {
  return 'prompt' in event && typeof (event as BeforeInstallPromptEvent).prompt === 'function';
}
