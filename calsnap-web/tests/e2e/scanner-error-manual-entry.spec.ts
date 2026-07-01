import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  fillManualMealItem,
  logMealAndExpectDashboard,
  mockAnalyzeMeal,
  uploadTestPhotoAndAnalyze,
} from './helpers';

const MANUAL_MEAL_NAME = 'Manual test meal';
const MANUAL_MEAL_CALORIES = 420;

test('503 analyze failure → manual entry → log → dashboard shows meal kcal', async ({ page }) => {
  await mockAnalyzeMeal(page, 503);
  await createOnboardedUser(page);

  await uploadTestPhotoAndAnalyze(page);

  await expect(
    page.getByRole('alert').filter({ hasText: copy('scanner.error.api') }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: copy('scanner.capture.manualEntry') }).click();

  await fillManualMealItem(page, {
    name: MANUAL_MEAL_NAME,
    calories: MANUAL_MEAL_CALORIES,
  });
  await page.getByRole('button', { name: copy('common.button.continue') }).click();

  await expect(page.getByText(MANUAL_MEAL_NAME)).toBeVisible({ timeout: 10_000 });
  await logMealAndExpectDashboard(page, MANUAL_MEAL_CALORIES);
});
