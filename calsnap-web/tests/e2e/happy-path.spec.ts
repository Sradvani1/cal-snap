import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  firstItemName,
  logMealAndExpectDashboard,
  mockAnalyzeMeal,
  totalCalories,
  uploadTestPhotoAndAnalyze,
} from './helpers';

test('signup → onboarding → scan → log → weigh-in', async ({ page }) => {
  await mockAnalyzeMeal(page);
  await createOnboardedUser(page);

  await uploadTestPhotoAndAnalyze(page);

  await expect(page.getByText(firstItemName())).toBeVisible({ timeout: 15_000 });
  await logMealAndExpectDashboard(page, totalCalories());

  await page.getByRole('link', { name: copy('common.nav.progress') }).click();
  await page.getByRole('button', { name: copy('progress.logWeighIn') }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: copy('progress.weighIn.save') }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
});
