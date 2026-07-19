'use client';

import { useEffect, useRef } from 'react';

/** Pixel drop in visualViewport.height that qualifies as "keyboard open". */
const KEYBOARD_HEIGHT_THRESHOLD = 80;

/** Tolerance (px) when comparing current height against baseline or document element height. */
const RECOVERY_TOLERANCE = 2;

/**
 * Returns true when running in an iOS standalone PWA context where the
 * keyboard-dismiss viewport-stalling bug is known to occur.
 *
 * Checks `navigator.standalone` (proprietary iOS Safari property) first,
 * then falls back to `display-mode: standalone` media query + iOS UA.
 */
export function isIOSStandalone(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  const uaData = (navigator as Navigator & { userAgentData?: { platform: string } })
    .userAgentData;
  const isIOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (typeof uaData?.platform === 'string' && uaData.platform === 'iOS');

  if (!isIOS) return false;

  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Pure state-machine transition for the viewport-recovery FSM.
 *
 * @returns The next state: `{ recover, newBaseline, newKeyboardWasOpen }`.
 *   `recover === true` signals the caller should fire the scrollTo workaround.
 */
export function evaluateRecovery(params: {
  baseline: number | null;
  keyboardWasOpen: boolean;
  currentHeight: number;
  docHeight: number;
}): {
  recover: boolean;
  newBaseline: number | null;
  newKeyboardWasOpen: boolean;
} {
  const { baseline, keyboardWasOpen, currentHeight, docHeight } = params;

  if (baseline === null) {
    // First event — seed the baseline, no recovery.
    return { recover: false, newBaseline: currentHeight, newKeyboardWasOpen: false };
  }

  const drop = baseline - currentHeight;

  if (drop > KEYBOARD_HEIGHT_THRESHOLD) {
    // Viewport shrank materially — keyboard opened.
    return { recover: false, newBaseline: baseline, newKeyboardWasOpen: true };
  }

  if (!keyboardWasOpen) {
    // Normal resize (orientation, split-screen, etc.) — update baseline.
    return { recover: false, newBaseline: currentHeight, newKeyboardWasOpen: false };
  }

  // Keyboard was open — check if it closed.
  // Only allow recovery when the height has truly returned to a resting
  // value.  The `atBaseline` check covers the common case where the
  // layout viewport recovers fully.  The `atDocHeight` check covers the
  // known WebKit scenario where innerHeight lags but
  // document.documentElement.clientHeight already reports the correct
  // value (the technique documented in WebKit bug tracker workarounds).
  const atBaseline = Math.abs(currentHeight - baseline) <= RECOVERY_TOLERANCE;
  const atDocHeight = Math.abs(currentHeight - docHeight) <= RECOVERY_TOLERANCE;

  if (atBaseline || atDocHeight) {
    return {
      recover: true,
      newBaseline: currentHeight,
      newKeyboardWasOpen: false,
    };
  }

  // Still in an intermediate state.
  return { recover: false, newBaseline: baseline, newKeyboardWasOpen: true };
}

/**
 * iOS standalone PWA keyboard-dismiss viewport-recovery shim.
 *
 * Subscribes to `window.visualViewport.resize` events.  When the visual
 * viewport returns to full height after a keyboard-open transition, fires
 * a programmatic root scroll that forces WebKit to flush the deferred
 * layout-viewport repaint and snap `position: fixed` elements back to the
 * physical screen bottom.
 *
 * Mount this hook once in the authenticated app shell.  It guards itself
 * against non-iOS, non-standalone, and non-supporting environments.
 */
export function useIOSStandaloneViewportRecovery(): void {
  const rafRef = useRef<number | null>(null);
  const keyboardWasOpenRef = useRef(false);
  const baselineRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isIOSStandalone()) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const state = evaluateRecovery({
          baseline: baselineRef.current,
          keyboardWasOpen: keyboardWasOpenRef.current,
          currentHeight: vv.height,
          docHeight: document.documentElement.clientHeight,
        });

        baselineRef.current = state.newBaseline;
        keyboardWasOpenRef.current = state.newKeyboardWasOpen;

        if (state.recover) {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      });
    };

    vv.addEventListener('resize', onResize);
    baselineRef.current = vv.height;

    return () => {
      vv.removeEventListener('resize', onResize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
