import { describe, expect, it } from 'vitest';

import {
  calorieBandLabel,
  calorieRingAccessibilityLabel,
  calorieRingAccessibilityValue,
} from '@/lib/design/calorie-ring-accessibility';

describe('calorie ring accessibility', () => {
  it('returns static label', () => {
    expect(calorieRingAccessibilityLabel()).toBe('Calorie progress');
  });

  it('describes remaining calories', () => {
    expect(calorieRingAccessibilityValue(800, 2000)).toBe(
      '800 calories remaining of 2000 goal',
    );
  });

  it('describes over-goal calories', () => {
    expect(calorieRingAccessibilityValue(-300, 2000)).toBe(
      '300 calories over 2000 goal',
    );
  });

  it('maps band labels', () => {
    expect(calorieBandLabel('under')).toBe('Under goal');
    expect(calorieBandLabel('onTrack')).toBe('On track');
    expect(calorieBandLabel('over')).toBe('Over goal');
  });
});
