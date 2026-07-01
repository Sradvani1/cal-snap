import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { copy } from '@/lib/copy';
import { executePlateauDietBreak } from '@/lib/dashboard/plateau-actions';
import {
  isMaintenanceModeActive,
  maintenanceModeKey,
  readStoredDate,
} from '@/lib/dashboard/plateau-state';
import type { UserProfile } from '@/lib/models/user-profile';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = new Date();
  return {
    id: 'user-1',
    name: 'Alex',
    sex: 'female',
    dateOfBirth: new Date(1990, 0, 1),
    heightCm: 165,
    startingWeightKg: 70,
    goalWeightKg: 60,
    goalTargetDate: new Date(2027, 0, 1),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2000,
    tdee: 2350,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('executePlateauDietBreak', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value);
          },
          removeItem: (key: string) => {
            storage.delete(key);
          },
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('stores maintenance mode and succeeds when save succeeds', async () => {
    const profile = makeProfile();
    const updateTargets = vi.fn().mockResolvedValue(profile);

    const result = await executePlateauDietBreak('user-1', profile, updateTargets);

    expect(result).toEqual({ ok: true });
    expect(updateTargets).toHaveBeenCalledWith('user-1', {
      dailyCalorieTarget: 2350,
      deficitKcal: 0,
    });
    expect(isMaintenanceModeActive('user-1')).toBe(true);
  });

  it('keeps maintenance unset and returns error when save fails', async () => {
    const profile = makeProfile();
    const updateTargets = vi.fn().mockRejectedValue(new Error('Simulated save failure'));

    const result = await executePlateauDietBreak('user-1', profile, updateTargets);

    expect(result).toEqual({ ok: false, error: copy('dashboard.plateau.error.saveFailed') });
    expect(readStoredDate(maintenanceModeKey('user-1'))).toBeNull();
    expect(isMaintenanceModeActive('user-1')).toBe(false);
  });
});
