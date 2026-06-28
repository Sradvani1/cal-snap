import { describe, expect, it } from 'vitest';

import {
  calorieProgressColor,
  calorieProgressStrokeClass,
  fiberProgressColor,
  lightColors,
} from '@/lib/design/colors';

describe('design colors', () => {
  it('maps calorie bands to iOS semantic colors', () => {
    expect(calorieProgressColor('under')).toBe('var(--cs-success)');
    expect(calorieProgressColor('onTrack')).toBe('var(--cs-warning)');
    expect(calorieProgressColor('over')).toBe('var(--cs-danger)');
  });

  it('maps fiber bands to semantic colors', () => {
    expect(fiberProgressColor('onTrack')).toBe('var(--cs-success)');
    expect(fiberProgressColor('moderate')).toBe('var(--cs-warning)');
    expect(fiberProgressColor('low')).toBe('var(--cs-danger)');
  });

  it('exposes stroke classes for SVG rings', () => {
    expect(calorieProgressStrokeClass('under')).toBe('stroke-cs-success');
    expect(calorieProgressStrokeClass('onTrack')).toBe('stroke-cs-warning');
    expect(calorieProgressStrokeClass('over')).toBe('stroke-cs-danger');
  });

  it('matches iOS light primary hex', () => {
    expect(lightColors.primary).toBe('#3DA35D');
    expect(lightColors.success).toBe('#34C759');
    expect(lightColors.warning).toBe('#FFCC00');
    expect(lightColors.danger).toBe('#FF3B30');
  });
});
