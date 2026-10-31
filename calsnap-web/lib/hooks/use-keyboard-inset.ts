'use client';

import { useEffect, useRef, useSyncExternalStore, type FocusEvent } from 'react';

/** Pixels of virtual keyboard overlapping the layout viewport bottom. 0 when closed or unsupported. */
export function computeKeyboardInset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const vv = window.visualViewport;
  if (!vv) {
    return 0;
  }
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
}

function subscribeKeyboardInset(onStoreChange: () => void): () => void {
  const vv = window.visualViewport;
  if (!vv) {
    return () => {};
  }
  vv.addEventListener('resize', onStoreChange);
  vv.addEventListener('scroll', onStoreChange);
  return () => {
    vv.removeEventListener('resize', onStoreChange);
    vv.removeEventListener('scroll', onStoreChange);
  };
}

function getKeyboardInsetServerSnapshot(): number {
  return 0;
}

export function useKeyboardInset(): number {
  return useSyncExternalStore(
    subscribeKeyboardInset,
    computeKeyboardInset,
    getKeyboardInsetServerSnapshot,
  );
}

/** Scroll the focused form control into view. Instant: smooth scrolling races the iOS keyboard animation and can wedge the visual viewport. */
export function scrollFormFieldIntoView(event: FocusEvent<HTMLElement>): void {
  const focusedElement = event.target as { scrollIntoView?: (options?: ScrollIntoViewOptions) => void } | null;
  if (!focusedElement || typeof focusedElement.scrollIntoView !== 'function') {
    return;
  }
  focusedElement.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

/**
 * True on the visual-viewport transition from keyboard-open to keyboard-closed.
 * Pure predicate so the close detection is unit-testable.
 */
export function didKeyboardClose(prevInset: number, nextInset: number): boolean {
  return prevInset > 0 && nextInset === 0;
}

/**
 * Forces Safari to drop a stuck keyboard pan. iOS sometimes fails to snap the
 * visual viewport back on keyboard dismissal, leaving the whole shell (tab bar
 * included) floating above the screen bottom until the user touch-scrolls. A
 * zero-distance scroll on the live scrollers makes Safari recomposite and
 * release the pan. No visible effect when nothing is stuck.
 */
export function releaseStuckViewportPan(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const main = document.querySelector('.app-main');
  requestAnimationFrame(() => {
    window.scrollTo(window.scrollX, window.scrollY);
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: main.scrollTop, left: main.scrollLeft });
    }
  });
}

/**
 * Mount once (AppProviders): watches keyboard open/close via the visual
 * viewport and releases a stuck pan on close. Covers every screen, including
 * client-side navigations that preserve the stuck state.
 */
export function useKeyboardViewportReset(): void {
  const prevInsetRef = useRef<number>(0);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const vv = window.visualViewport;
    if (!vv) {
      return;
    }
    const onChange = () => {
      const next = computeKeyboardInset();
      const prev = prevInsetRef.current;
      prevInsetRef.current = next;
      if (didKeyboardClose(prev, next)) {
        releaseStuckViewportPan();
      }
    };
    onChange();
    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
    };
  }, []);
}
