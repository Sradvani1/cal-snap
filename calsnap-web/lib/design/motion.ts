'use client';

import { useSyncExternalStore } from 'react';

/** Approximates iOS spring(response: 0.6, dampingFraction: 0.8) */
export const RING_SPRING_MS = 600;
export const RING_SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export const SCAN_STAGGER_MS = 50;
export const SCAN_FADE_MS = 300;

export const SHEET_SLIDE_MS = 300;
export const SHEET_SLIDE_EASING = 'ease-out';

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}
