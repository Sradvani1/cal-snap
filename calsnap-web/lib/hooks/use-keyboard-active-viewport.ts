'use client';

/**
 * TEMP EXPERIMENT: useKeyboardActiveViewport
 *
 * On focusin of an editable element, registers a visualViewport.resize
 * listener that sets html/body height to window.visualViewport.height in
 * pixels (wrapped in rAF).  On focusout, if no other editable element has
 * focus, the listener is removed and inline styles are cleared.
 *
 * When html.keyboard-active is present, the CSS rule
 *   .keyboard-active .app-shell { height: 100%; max-height: 100%; }
 * overrides the default h-dvh/max-h-dvh so the shell sizes to the
 * parent body (whose height tracks visualViewport.height during
 * keyboard activity), keeping the in-flow BottomTabNav at the visual
 * viewport's bottom edge.
 *
 * Hypothesis:  when the keyboard dismisses, visualViewport.resize fires
 * with the new (larger) height, the resize handler sets html/body to the
 * correct pixel height, and the shell + nav follow immediately — no
 * WebKit deferral because inline pixel heights are applied synchronously.
 *
 * If this fails, the root cause is likely that WebKit ignores the resize
 * handler's timing or defers the style recompute even for inline pixels.
 * No further fallback is planned — this experiment marks the last
 * candidate before adopting the Capacitor/Flutter container-scroll
 * approach already documented in the failure report.
 *
 * SEE docs/build/FIXED-BOTTOM-NAV-FAILURE-REPORT.md
 */

import { useEffect, useRef } from 'react';

export function isEditableElement(el: unknown): boolean {
  if (!el || typeof el !== 'object') return false;
  const node = el as { tagName?: string; isContentEditable?: boolean };
  if (typeof node.tagName !== 'string') return false;
  const tag = node.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || node.isContentEditable === true;
}

export function useKeyboardActiveViewport(): void {
  const handlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (!isEditableElement(e.target)) return;
      if (!window.visualViewport) return;
      if (handlerRef.current) return; // already registered

      const onResize = () => {
        requestAnimationFrame(() => {
          const vv = window.visualViewport;
          if (!vv) return;
          const h = vv.height;
          if (!h || h <= 0) return;

          const px = `${h}px`;
          document.documentElement.style.height = px;
          document.body.style.height = px;
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          document.documentElement.classList.add('keyboard-active');
        });
      };

      window.visualViewport.addEventListener('resize', onResize);
      handlerRef.current = onResize;
      onResize();
    };

    const handleFocusOut = () => {
      const handler = handlerRef.current;
      if (!handler) return;

      requestAnimationFrame(() => {
        if (isEditableElement(document.activeElement)) return; // focus moved to another editable

        window.visualViewport?.removeEventListener('resize', handler);
        handlerRef.current = null;

        document.documentElement.style.height = '';
        document.body.style.height = '';
        document.documentElement.classList.remove('keyboard-active');
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);

      const handler = handlerRef.current;
      if (handler) {
        window.visualViewport?.removeEventListener('resize', handler);
        handlerRef.current = null;
      }
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.documentElement.classList.remove('keyboard-active');
    };
  }, []);
}
