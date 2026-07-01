import { describe, expect, it } from 'vitest';

import { copy, COPY_REGISTRY } from '@/lib/copy';
import { apiCopy } from '@/lib/copy/api';
import { designSystemCopy } from '@/lib/copy/design-system';

describe('copy module', () => {
  it('interpolates placeholders', () => {
    expect(
      copy('designSystem.calorieRing.ofGoal', { target: 2000 }),
    ).toBe('of 2000 kcal goal');
  });

  it('returns template when params omitted', () => {
    expect(copy('dashboard.greeting.today')).toBe('Today');
  });

  it('resolves all api keys', () => {
    for (const key of Object.keys(apiCopy) as Array<keyof typeof apiCopy>) {
      const value = COPY_REGISTRY[key];
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('resolves all designSystem keys', () => {
    for (const key of Object.keys(designSystemCopy) as Array<keyof typeof designSystemCopy>) {
      const value = COPY_REGISTRY[key];
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('leaves unknown placeholders intact', () => {
    expect(copy('dashboard.greeting.morning', {})).toBe('Good morning, {{name}}');
  });
});
