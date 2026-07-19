'use client';

import { useEffect, useRef } from 'react';

/**
 * Returns the current visual viewport height in CSS pixels, or `null` when
 * the API is unavailable (SSR, older browsers, server-side).
 */
export function getVisualViewportHeight(): number | null {
  if (typeof window === 'undefined') return null;
  const vv = window.visualViewport;
  if (!vv) return null;
  return vv.height;
}

/**
 * Sets `--app-visual-viewport-height` on the document root to the current
 * `window.visualViewport.height` pixel value, updating on resize and scroll
 * via rAF throttling.
 *
 * The CSS fallback `100dvh` applies before JavaScript runs and when
 * `visualViewport` is unsupported — no regression risk in those cases.
 *
 * When supported, the explicit pixel value from `visualViewport.height`
 * is synchronous per frame, avoiding the iOS WKWebView `dvh` update-lag
 * bug after keyboard transitions.
 */
export function useVisualViewportHeight(): void {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const setHeight = () => {
      const h = getVisualViewportHeight();
      if (h === null) return;
      document.documentElement.style.setProperty(
        '--app-visual-viewport-height',
        `${h}px`,
      );
    };

    const onEvent = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setHeight();
      });
    };

    setHeight();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', onEvent);
      vv.addEventListener('scroll', onEvent);
    } else {
      // Fallback: listen to window resize for browsers without visualViewport
      window.addEventListener('resize', onEvent);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (vv) {
        vv.removeEventListener('resize', onEvent);
        vv.removeEventListener('scroll', onEvent);
      } else {
        window.removeEventListener('resize', onEvent);
      }
    };
  }, []);
}
