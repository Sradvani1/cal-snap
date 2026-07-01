'use client';

import { useSyncExternalStore } from 'react';
import { darkColors, lightColors, type ChartColorPalette } from '@/lib/design/colors';

function subscribeChartColors(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onStoreChange);
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => {
    media.removeEventListener('change', onStoreChange);
    observer.disconnect();
  };
}

function isDarkModeActive(): boolean {
  if (document.documentElement.classList.contains('dark')) {
    return true;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getChartColorsSnapshot(): ChartColorPalette {
  return isDarkModeActive() ? darkColors : lightColors;
}

function getChartColorsServerSnapshot(): ChartColorPalette {
  return lightColors;
}

/** Returns light or dark Recharts palette based on system theme and `.dark` class. */
export function useChartColors(): ChartColorPalette {
  return useSyncExternalStore(
    subscribeChartColors,
    getChartColorsSnapshot,
    getChartColorsServerSnapshot,
  );
}
