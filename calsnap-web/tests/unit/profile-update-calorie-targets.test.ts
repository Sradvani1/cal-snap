import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Timestamp, type Firestore } from 'firebase/firestore';
import type { ProfileDoc } from '@/lib/models/profile-doc';
import { updateCalorieTargets } from '@/lib/repositories/profile';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    doc: vi.fn(() => ({ path: 'mock-profile-doc' })),
  };
});

function sampleProfileDoc(overrides: Partial<ProfileDoc> = {}): ProfileDoc {
  const now = Timestamp.fromDate(new Date('2026-06-27T12:00:00'));
  return {
    name: 'Alex',
    onboardingCompleted: true,
    sex: 'male',
    dateOfBirth: Timestamp.fromDate(new Date(1991, 5, 14)),
    heightCm: 178,
    startingWeightKg: 80,
    currentWeightKg: 78,
    goalWeightKg: 72,
    goalTargetDate: Timestamp.fromDate(new Date(2026, 11, 27)),
    activityLevel: 'moderatelyActive',
    dailyCalorieTarget: 2285,
    tdee: 2635,
    deficitKcal: 350,
    macroTargetProteinPct: 0.28,
    macroTargetCarbsPct: 0.47,
    macroTargetFatPct: 0.25,
    useLbsForWeight: false,
    useImperialForHeight: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('updateCalorieTargets', () => {
  const mockDb = {} as Firestore;

  beforeEach(() => {
    mockGetDoc.mockReset();
    mockSetDoc.mockReset();
    mockSetDoc.mockResolvedValue(undefined);
  });

  it('sets goalTargetDate null when deficit is zero', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => sampleProfileDoc(),
    });

    const updated = await updateCalorieTargets(
      'user-1',
      { dailyCalorieTarget: 2635, deficitKcal: 0 },
      mockDb,
    );

    expect(updated.deficitKcal).toBe(0);
    expect(updated.goalTargetDate).toBeNull();
    expect(mockSetDoc).toHaveBeenCalledOnce();
  });
});
