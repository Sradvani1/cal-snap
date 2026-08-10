import { describe, expect, it } from 'vitest';
import { resolveProfileRoute } from '@/lib/auth/resolve-profile-route';

describe('resolveProfileRoute', () => {
  it('does not redirect while loading or while the profile is unavailable', () => {
    expect(
      resolveProfileRoute({
        authLoading: true,
        hasUser: false,
        profilePending: false,
        profileError: false,
        onboardingCompleted: undefined,
      }),
    ).toBeNull();
    expect(
      resolveProfileRoute({
        authLoading: false,
        hasUser: true,
        profilePending: true,
        profileError: false,
        onboardingCompleted: undefined,
      }),
    ).toBeNull();
    expect(
      resolveProfileRoute({
        authLoading: false,
        hasUser: true,
        profilePending: false,
        profileError: true,
        onboardingCompleted: undefined,
      }),
    ).toBeNull();
  });

  it('distinguishes missing profiles from loaded profiles', () => {
    expect(
      resolveProfileRoute({
        authLoading: false,
        hasUser: false,
        profilePending: false,
        profileError: false,
        onboardingCompleted: undefined,
      }),
    ).toBe('/login');
    expect(
      resolveProfileRoute({
        authLoading: false,
        hasUser: true,
        profilePending: false,
        profileError: false,
        onboardingCompleted: false,
      }),
    ).toBe('/onboarding');
    expect(
      resolveProfileRoute({
        authLoading: false,
        hasUser: true,
        profilePending: false,
        profileError: false,
        onboardingCompleted: true,
      }),
    ).toBe('/dashboard');
  });
});
