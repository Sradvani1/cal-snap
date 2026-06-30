import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  firstItemName,
  mockAnalyzeMeal,
  totalCalories,
} from './helpers';

const testPhotoPath = path.join(__dirname, 'helpers', 'test-photo.jpg');

test('signup → onboarding → scan → log → weigh-in', async ({ page }) => {
  await mockAnalyzeMeal(page);
  await createOnboardedUser(page);

  await page.goto('/scan');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testPhotoPath);
  await page.getByRole('button', { name: copy('scanner.capture.analyze') }).click();

  await expect(page.getByText(firstItemName())).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: copy('scanner.result.logMeal') }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByRole('link', { name: new RegExp(`${totalCalories()} kcal`) })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('button', { name: copy('dashboard.weight.logWeighIn') }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: copy('progress.weighIn.save') }).click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
});

test.beforeAll(() => {
  if (!fs.existsSync(testPhotoPath)) {
    throw new Error(`Missing E2E test photo at ${testPhotoPath}`);
  }
});
