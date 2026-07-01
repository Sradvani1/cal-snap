import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';

export async function gotoMealLog(page: Page): Promise<void> {
  await page.getByRole('link', { name: copy('common.nav.log') }).click();
  await expect(page).toHaveURL(/\/log/);
  await expect(page.getByRole('heading', { name: copy('mealLog.title') })).toBeVisible();
}

export async function openMealRowActions(page: Page, calories: number): Promise<void> {
  const row = page
    .locator('.rounded-lg.bg-cs-muted\\/10')
    .filter({ hasText: `${calories} kcal` });
  await row.getByRole('button', { name: copy('mealLog.row.actions') }).click();
}

export async function openMealEditFromLog(page: Page, calories: number): Promise<void> {
  await openMealRowActions(page, calories);
  await page.getByRole('link', { name: copy('mealLog.row.edit') }).click();
  await expect(page).toHaveURL(/\/scan\/edit\//, { timeout: 15_000 });
}

export async function editScannedItemWeight(
  page: Page,
  itemName: string,
  newWeightG: number,
): Promise<void> {
  const itemRow = page.locator('.rounded-xl.border').filter({ hasText: itemName });
  await itemRow.getByRole('button', { name: copy('designSystem.foodItem.editHint') }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').locator('input[type="number"]').fill(String(newWeightG));
  await page.getByRole('button', { name: copy('common.button.save') }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

export async function saveMealEdits(page: Page): Promise<void> {
  await page.getByRole('button', { name: copy('scanner.result.saveChanges') }).click();
  await expect(page).toHaveURL(/\/log\/[^/]+$/, { timeout: 15_000 });
}

export async function expectMealCaloriesChanged(
  page: Page,
  previousCalories: number,
): Promise<void> {
  await expect(
    page
      .getByRole('link', { name: /\d+ kcal/ })
      .filter({ hasNotText: `${previousCalories} kcal` }),
  ).toBeVisible({ timeout: 15_000 });
}

async function expectDetailCaloriesChanged(page: Page, previousCalories: number): Promise<void> {
  const total = page.getByTestId('meal-detail-total-calories');
  await expect(total).not.toHaveText(`${previousCalories} kcal`);
  await expect(total).toContainText('kcal');
}

export async function expectMealCaloriesChangedOnSurfaces(
  page: Page,
  previousCalories: number,
): Promise<void> {
  await expectDetailCaloriesChanged(page, previousCalories);

  await gotoMealLog(page);
  await expectMealCaloriesChanged(page, previousCalories);

  await page.getByRole('link', { name: copy('common.nav.dashboard') }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expectMealCaloriesChanged(page, previousCalories);
}

export async function deleteMealFromLogList(page: Page, calories: number): Promise<void> {
  await openMealRowActions(page, calories);
  await page.getByRole('button', { name: copy('mealLog.actions.delete') }).click();
  await page.getByRole('button', { name: copy('mealLog.confirm.deleteAction') }).click();
  await expect(page.getByRole('link', { name: new RegExp(`${calories} kcal`) })).toHaveCount(0, {
    timeout: 15_000,
  });
}

export async function expectMealAbsent(page: Page, calories: number): Promise<void> {
  await expect(page.getByRole('link', { name: new RegExp(`${calories} kcal`) })).toHaveCount(0);
}
