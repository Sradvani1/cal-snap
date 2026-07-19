'use client';

import { useEffect, useRef } from 'react';

export function isEditableElement(el: unknown): boolean {
  if (!el || typeof el !== 'object') return false;
  const node = el as { tagName?: string; isContentEditable?: boolean };
  if (typeof node.tagName !== 'string') return false;
  const tag = node.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || node.isContentEditable === true;
}

/**
 * Forces a WebKit layout-viewport recompute after the keyboard dismisses
 * by applying the same 1-0 scroll nudge that a manual user tap triggers.
 *
 * Technique validated by Capacitor and Flutter iOS PWA workarounds:
 * programmatic scroll forces WebKit to flush deferred layout/compositor
 * state that the keyboard dismiss left stale.
 *
 * Two-rAF sequence (scrollTo(0,1) → scrollTo(0,0)) ensures the nudge
 * fires after WebKit has started settling the viewport post-dismiss.
 *
 * If device testing shows the nudge is a no-op (no scroll room at root),
 * the documented fallback is to nudge the scrollable <main> container
 * instead of window.  If timing is the issue (rAF fires before keyboard
 * animation completes), replace the double-rAF with a 150-300ms
 * setTimeout delay.
 *
 *     // container-scroll fallback:
 *     document.querySelector<HTMLElement>('main')?.scrollBy?.(0, 1);
 *     document.querySelector<HTMLElement>('main')?.scrollBy?.(0, -1);
 *
 *     // animation-timing fallback:
 *     setTimeout(() => {
 *       window.scrollTo(0, 1);
 *       requestAnimationFrame(() => window.scrollTo(0, 0));
 *     }, 200);
 */
export function useKeyboardDismissRecovery(): void {
  const wasEditingRef = useRef(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isEditableElement(e.target)) wasEditingRef.current = true;
    };

    const onFocusOut = () => {
      if (!wasEditingRef.current) return;
      wasEditingRef.current = false;
      requestAnimationFrame(() => {
        window.scrollTo(0, 1);
        requestAnimationFrame(() => window.scrollTo(0, 0));
      });
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);
}
