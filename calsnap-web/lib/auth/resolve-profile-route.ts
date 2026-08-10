export interface ProfileRouteInput {
  authLoading: boolean;
  hasUser: boolean;
  profilePending: boolean;
  profileError: boolean;
  onboardingCompleted: boolean | undefined;
}

export function resolveProfileRoute(
  input: ProfileRouteInput,
): '/login' | '/onboarding' | '/dashboard' | null {
  if (input.authLoading) {
    return null;
  }
  if (!input.hasUser) {
    return '/login';
  }
  if (input.profilePending || input.profileError) {
    return null;
  }
  return input.onboardingCompleted === true ? '/dashboard' : '/onboarding';
}
