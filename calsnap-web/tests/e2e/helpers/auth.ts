import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';
import { completeOnboarding } from './onboarding';
import { gotoAppRoute } from './navigation';

export const E2E_TEST_PASSWORD = 'test-password-123';

export function uniqueTestEmail(): string {
  return `e2e-${Date.now()}@example.com`;
}

export async function signUpWithEmail(
  page: Page,
  email: string = uniqueTestEmail(),
  password: string = E2E_TEST_PASSWORD,
): Promise<{ email: string; password: string }> {
  await page.goto('/signup');
  await page.getByLabel(copy('common.label.email')).fill(email);
  await page.getByLabel(copy('common.label.password')).fill(password);
  await page.getByRole('button', { name: copy('auth.signup.submit') }).click();

  await expect(page).toHaveURL(/\/(onboarding)?$/, { timeout: 15_000 });
  if (!page.url().includes('/onboarding')) {
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
  }

  return { email, password };
}

export async function loginWithEmail(
  page: Page,
  email: string,
  password: string = E2E_TEST_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(copy('common.label.email')).fill(email);
  await page.getByLabel(copy('common.label.password')).fill(password);
  await page.getByRole('button', { name: copy('auth.login.submit') }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
}

export async function createOnboardedUser(
  page: Page,
): Promise<{ email: string; password: string }> {
  const credentials = await signUpWithEmail(page);
  await completeOnboarding(page);
  return credentials;
}

export async function signOut(page: Page): Promise<void> {
  await gotoAppRoute(page, '/settings');
  await page.getByRole('button', { name: copy('settings.account.signOut') }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
}
