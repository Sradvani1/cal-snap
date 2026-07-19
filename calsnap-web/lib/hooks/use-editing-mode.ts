'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * TEMPORARY EXPERIMENT — DELETE AFTER DEVICE TESTING.
 *
 * Tracks whether any editable element (input, textarea, [contenteditable])
 * has document focus via capture-phase focusin/focusout listeners.
 * On focusout, waits one rAF and checks whether focus moved to another
 * editable element before exiting editing mode.
 */

export function isEditableElement(el: unknown): boolean {
  if (!el || typeof el !== 'object') return false;

  const node = el as { tagName?: string; isContentEditable?: boolean };
  if (typeof node.tagName !== 'string') return false;

  const tag = node.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || node.isContentEditable === true;
}

export function useEditingMode(): boolean {
  const [editing, setEditing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isEditableElement(e.target)) setEditing(true);
    };

    const onFocusOut = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!isEditableElement(document.activeElement)) setEditing(false);
      });
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return editing;
}
