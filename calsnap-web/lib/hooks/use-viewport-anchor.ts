'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Pixels between the layout viewport bottom and the visual viewport bottom.
 * Drives the inline `bottom` style on the fixed tab bar so it tracks the
 * visual viewport edge instead of waiting for WebKit to repaint after the
 * keyboard dismisses. 0 when the keyboard is closed or the API is unavailable.
 */
export function computeViewportAnchorBottom(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const vv = window.visualViewport;
  if (!vv) {
    return 0;
  }
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
}

function applyAnchor(el: HTMLElement | null): void {
  if (!el) {
    return;
  }
  el.style.bottom = `${computeViewportAnchorBottom()}px`;
  // Force WebKit to flush the deferred fixed-position relayout it would
  // otherwise delay until the next user scroll gesture.
  void el.offsetHeight;
}

/**
 * Re-anchors a `position: fixed; bottom: 0` element to the visual viewport
 * bottom on every viewport change (keyboard open/close, scroll, orientation).
 * Works around the WebKit standalone PWA bug where fixed elements are not
 * repainted after the keyboard dismisses until a scroll gesture forces it.
 */
export function useViewportAnchor(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') {
      return;
    }
    const vv = window.visualViewport;

    const sync = () => applyAnchor(el);
    // Keyboard dismiss animation can finish after the last visualViewport
    // resize; re-sync shortly after any input blurs to catch the settled state.
    const onFocusOut = () => window.setTimeout(sync, 100);

    sync();
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('focusout', onFocusOut);

    return () => {
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, [ref]);
}
