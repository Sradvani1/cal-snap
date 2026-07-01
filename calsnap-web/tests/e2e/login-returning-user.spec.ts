import { test, expect } from '@playwright/test';
import {
  createOnboardedUser,
  loginWithEmail,
  signOut,
  waitForDashboard,
} from './helpers';

test('login returning user skips onboarding', async ({ page }) => {
  const { email, password } = await createOnboardedUser(page);
  await signOut(page);
  await loginWithEmail(page, email, password);
  await waitForDashboard(page);
  await expect(page).not.toHaveURL(/\/onboarding/);
});
