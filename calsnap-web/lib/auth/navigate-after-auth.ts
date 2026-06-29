import type { User } from 'firebase/auth';
import { isOnboardingComplete } from '@/lib/repositories/profile';

/** Full navigation so middleware sees the httpOnly session cookie. */
export async function navigateAfterAuth(user: User): Promise<void> {
  const complete = await isOnboardingComplete(user.uid);
  window.location.assign(complete ? '/dashboard' : '/onboarding');
}
