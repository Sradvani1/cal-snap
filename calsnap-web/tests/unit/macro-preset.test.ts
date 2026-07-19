import { describe, expect, it } from 'vitest';
import {
  detectPreset,
  getPresetValues,
  MACRO_PRESETS,
  MACRO_PRESET_KEYS,
} from '@/lib/models/macro-preset';

describe('macro-preset helpers', () => {
  it('getPresetValues returns the correct preset values', () => {
    expect(getPresetValues('balanced')).toEqual({ proteinPct: 28, carbsPct: 47, fatPct: 25 });
    expect(getPresetValues('moreCarbs')).toEqual({ proteinPct: 25, carbsPct: 55, fatPct: 20 });
    expect(getPresetValues('moreProtein')).toEqual({ proteinPct: 33, carbsPct: 42, fatPct: 25 });
  });

  it('getPresetValues sum to 100 for all presets', () => {
    for (const key of MACRO_PRESET_KEYS) {
      const v = getPresetValues(key);
      expect(v.proteinPct + v.carbsPct + v.fatPct).toBe(100);
    }
  });

  it('detectPreset returns the correct key for exact matches', () => {
    expect(detectPreset(28, 47, 25)).toBe('balanced');
    expect(detectPreset(25, 55, 20)).toBe('moreCarbs');
    expect(detectPreset(33, 42, 25)).toBe('moreProtein');
  });

  it('detectPreset returns null for non-exact matches', () => {
    expect(detectPreset(30, 40, 30)).toBeNull();
    expect(detectPreset(28, 48, 24)).toBeNull();
    expect(detectPreset(20, 60, 20)).toBeNull();
  });

  it('detectPreset returns null when values exist but wrong sum', () => {
    expect(detectPreset(0, 0, 0)).toBeNull();
    expect(detectPreset(50, 50, 50)).toBeNull();
  });

  it('MACRO_PRESETS keys match MACRO_PRESET_KEYS entries', () => {
    const keys = Object.keys(MACRO_PRESETS);
    expect(MACRO_PRESET_KEYS).toHaveLength(keys.length);
    for (const key of keys) {
      expect(MACRO_PRESET_KEYS).toContain(key);
    }
  });
});
