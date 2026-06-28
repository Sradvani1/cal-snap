import type { CalorieProgressBand } from '@/lib/dashboard/calorie-progress';
import { copy } from '@/lib/copy';

export function calorieRingAccessibilityLabel(): string {
  return copy('designSystem.calorieRing.accessibility.label');
}

export function calorieRingAccessibilityValue(remaining: number, target: number): string {
  if (remaining >= 0) {
    return copy('designSystem.calorieRing.accessibility.remaining', {
      remaining,
      target,
    });
  }
  return copy('designSystem.calorieRing.accessibility.over', {
    over: Math.abs(remaining),
    target,
  });
}

export function calorieBandLabel(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return copy('designSystem.calorieRing.band.under');
    case 'onTrack':
      return copy('designSystem.calorieRing.band.onTrack');
    case 'over':
      return copy('designSystem.calorieRing.band.over');
  }
}

export function calorieBandIcon(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return '↓';
    case 'onTrack':
      return '✓';
    case 'over':
      return '↑';
  }
}
