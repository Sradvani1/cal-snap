'use client';

import { useSyncExternalStore, type FocusEvent } from 'react';

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

/** Scroll focused form control into view; respects prefers-reduced-motion for behavior. */
export function scrollFormFieldIntoView(event: FocusEvent<HTMLElement>): void {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusedElement = event.target as { scrollIntoView?: (options?: ScrollIntoViewOptions) => void } | null;
  if (!focusedElement || typeof focusedElement.scrollIntoView !== 'function') {
    return;
  }
  focusedElement.scrollIntoView({
    block: 'nearest',
    behavior: reducedMotion ? 'instant' : 'smooth',
  });
}
