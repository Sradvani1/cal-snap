import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  deleteMealFromLogList,
  editScannedItemWeight,
  expectMealAbsent,
  expectMealCaloriesChangedOnSurfaces,
  firstItemName,
  gotoMealLog,
  logMealAndExpectDashboard,
  mockAnalyzeMeal,
  openMealEditFromLog,
  saveMealEdits,
  totalCalories,
  uploadTestPhotoAndAnalyze,
} from './helpers';

const ORIGINAL_CALORIES = totalCalories();

async function scanAndLogMeal(page: Parameters<typeof createOnboardedUser>[0]): Promise<void> {
  await mockAnalyzeMeal(page);
  await createOnboardedUser(page);
  await uploadTestPhotoAndAnalyze(page);
  await expect(page.getByText(firstItemName())).toBeVisible({ timeout: 15_000 });
  await logMealAndExpectDashboard(page, ORIGINAL_CALORIES);
}

test('edit scanned meal updates detail, log, and dashboard', async ({ page }) => {
  await scanAndLogMeal(page);

  await gotoMealLog(page);
  await openMealEditFromLog(page, ORIGINAL_CALORIES);
  await editScannedItemWeight(page, firstItemName(), 200);
  await saveMealEdits(page);
  await expectMealCaloriesChangedOnSurfaces(page, ORIGINAL_CALORIES);
});

test('delete meal from log list removes from log and dashboard', async ({ page }) => {
  await scanAndLogMeal(page);

  await gotoMealLog(page);
  await deleteMealFromLogList(page, ORIGINAL_CALORIES);

  await page.getByRole('link', { name: copy('common.nav.dashboard') }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expectMealAbsent(page, ORIGINAL_CALORIES);
});
