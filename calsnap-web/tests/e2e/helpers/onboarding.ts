import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';

export async function completeOnboarding(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByRole('button', { name: copy('common.button.continue') }).click();
  await page.getByRole('button', { name: copy('common.button.continue') }).click();
  await page.getByRole('button', { name: copy('common.button.continue') }).click();

  await page.getByRole('button', { name: copy('common.button.saveContinue') }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}
