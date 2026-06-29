import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';

function goalDateInputValue(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function completeOnboarding(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByRole('button', { name: copy('common.button.continue') }).click();
  await page.getByRole('button', { name: copy('common.button.continue') }).click();

  const goalDate = goalDateInputValue();
  await page.locator('input[type="date"]').fill(goalDate);
  await page.getByRole('button', { name: copy('common.button.continue') }).click();

  await page.getByRole('button', { name: copy('common.button.saveContinue') }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}
