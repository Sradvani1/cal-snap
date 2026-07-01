'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import {
  dismissPwaInstall,
  isBeforeInstallPromptEvent,
  readInstallBannerEligible,
  subscribeInstallBanner,
  suppressInstallBanner,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa/install-storage';

interface InstallPromptBannerProps {
  uid: string;
}

function detectIosUserAgent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPromptBanner({ uid }: InstallPromptBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  const storedEligible = useSyncExternalStore(
    subscribeInstallBanner,
    () => readInstallBannerEligible(uid),
    () => false,
  );
  const eligible = storedEligible && !dismissed;
  const isIos = detectIosUserAgent();

  useEffect(() => {
    if (!eligible) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isBeforeInstallPromptEvent(event)) {
        setDeferredPrompt(event);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [eligible]);

  if (!eligible) {
    return null;
  }

  const handleDismiss = () => {
    dismissPwaInstall(uid);
    suppressInstallBanner(uid);
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismissPwaInstall(uid);
    suppressInstallBanner(uid);
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="pt-safe mx-auto mb-4 max-w-lg rounded-2xl border border-cs-border bg-cs-surface p-4 shadow-sm"
    >
      <p className={typography.csCardTitle}>{copy('pwa.install.title')}</p>
      <p className={`${typography.csCaption} mt-1`}>
        {isIos ? copy('pwa.install.body.ios') : copy('pwa.install.body.android')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {deferredPrompt && (
          <PrimaryButton type="button" onClick={() => void handleInstall()} className="min-h-11 flex-1">
            {copy('pwa.install.cta')}
          </PrimaryButton>
        )}
        <SecondaryButton type="button" onClick={handleDismiss} className="min-h-11 flex-1">
          {copy('pwa.install.dismiss')}
        </SecondaryButton>
      </div>
    </div>
  );
}
