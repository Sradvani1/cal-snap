'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore, type FocusEvent } from 'react';

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

/**
 * Focus-session scroll anchor so keyboard-dismiss drift can be undone. iOS
 * Safari undoes its own keyboard pan but not our programmatic scroll — without
 * a matching restore the page keeps a small scroll offset and the tab bar
 * floats above the bottom until the user pulls down.
 */
export interface KeyboardScrollSession {
  anchorY: number | null;
}

export function createKeyboardScrollSession(): KeyboardScrollSession {
  return { anchorY: null };
}

/** Records the page scroll position when a focus session starts (first field only). */
export function noteKeyboardScrollFocus(session: KeyboardScrollSession, scrollY: number): void {
  if (session.anchorY === null) {
    session.anchorY = scrollY;
  }
}

/**
 * Returns the scroll position to restore when focus leaves, then clears the
 * session. Null means leave the page alone (no session, or nothing moved).
 */
export function takeKeyboardScrollRestore(
  session: KeyboardScrollSession,
  currentScrollY: number,
): number | null {
  const anchor = session.anchorY;
  session.anchorY = null;
  if (anchor === null || anchor === currentScrollY) return null;
  return anchor;
}

/**
 * Pairs focus scrolling with a matching restore. Spread onto the container
 * holding the inputs: focus entering records the scroll position (and still
 * scrolls the field into view); focus leaving the container restores it.
 * Moving between fields inside the container keeps the session, so tabbing
 * through a form never yanks the page.
 */
export function useKeyboardScrollRestore(): {
  onFocusCapture: (event: FocusEvent<HTMLElement>) => void;
  onBlurCapture: (event: FocusEvent<HTMLElement>) => void;
} {
  const sessionRef = useRef<KeyboardScrollSession>(createKeyboardScrollSession());

  const onFocusCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    if (typeof window !== 'undefined') {
      noteKeyboardScrollFocus(sessionRef.current, window.scrollY);
    }
    scrollFormFieldIntoView(event);
  }, []);

  const onBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    if (typeof window === 'undefined') return;
    const next = event.relatedTarget as Node | null;
    if (event.currentTarget.contains(next)) return;
    const target = takeKeyboardScrollRestore(sessionRef.current, window.scrollY);
    if (target === null) return;
    const y = target;
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
  }, []);

  return useMemo(() => ({ onFocusCapture, onBlurCapture }), [onFocusCapture, onBlurCapture]);
}
