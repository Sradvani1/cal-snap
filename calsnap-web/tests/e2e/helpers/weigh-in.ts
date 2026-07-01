import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';
import { displayWeight } from '@/lib/utilities/unit-formatters';

export async function readDashboardCalorieTarget(page: Page): Promise<number> {
  const text = await page.getByText(/of \d+ kcal goal/).textContent();
  const match = text?.match(/of (\d+) kcal goal/);
  if (!match) {
    throw new Error('Could not read dashboard calorie target');
  }
  return Number(match[1]);
}

export async function openWeighInFromDashboard(page: Page): Promise<void> {
  await page.getByRole('button', { name: copy('dashboard.weight.logWeighIn') }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function fillWeighInWeightKg(page: Page, weightKg: number): Promise<void> {
  const lbs = displayWeight(weightKg, true);
  const input = page.getByRole('dialog').locator('input[type="number"]').first();
  await input.click();
  await input.clear();
  await input.fill(String(lbs));
  await expect(input).toHaveValue(String(lbs));
}

export async function saveWeighIn(page: Page): Promise<void> {
  const saveButton = page.getByRole('button', { name: copy('progress.weighIn.save') });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 });
}

export async function logWeighInAndExpectLowerTarget(
  page: Page,
  newWeightKg: number,
): Promise<void> {
  const previousTarget = await readDashboardCalorieTarget(page);
  await openWeighInFromDashboard(page);
  await fillWeighInWeightKg(page, newWeightKg);
  await saveWeighIn(page);
  await expect
    .poll(async () => readDashboardCalorieTarget(page), { timeout: 15_000 })
    .toBeLessThan(previousTarget);
}
