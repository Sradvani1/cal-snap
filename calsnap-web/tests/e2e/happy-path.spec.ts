import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import mealAnalysis from './helpers/fixtures/meal-analysis.json';
import { completeOnboarding } from './helpers/onboarding';
import { copy } from '@/lib/copy';

const testPhotoPath = path.join(__dirname, 'helpers', 'test-photo.jpg');

test('signup → onboarding → scan → log → weigh-in', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'test-password-123';

  await page.route('**/api/analyze-meal', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mealAnalysis),
    });
  });

  await page.goto('/signup');
  await page.getByLabel(copy('common.label.email')).fill(email);
  await page.getByLabel(copy('common.label.password')).fill(password);
  await page.getByRole('button', { name: copy('auth.signup.submit') }).click();

  await expect(page).toHaveURL(/\/(onboarding)?$/, { timeout: 15_000 });
  if (!page.url().includes('/onboarding')) {
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
  }

  await completeOnboarding(page);

  await page.goto('/scan');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testPhotoPath);
  await page.getByRole('button', { name: copy('scanner.capture.analyze') }).click();

  await expect(page.getByText('Grilled chicken')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: copy('scanner.result.logMeal') }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByRole('link', { name: /382 kcal/ })).toBeVisible({ timeout: 15_000 });

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
