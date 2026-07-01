import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { copy } from '@/lib/copy';

const testPhotoPath = path.join(__dirname, 'test-photo.jpg');

export function assertTestPhotoExists(): void {
  if (!fs.existsSync(testPhotoPath)) {
    throw new Error(`Missing E2E test photo at ${testPhotoPath}`);
  }
}

export async function uploadTestPhotoAndAnalyze(page: Page): Promise<void> {
  assertTestPhotoExists();
  await page.goto('/scan');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testPhotoPath);
  await page.getByRole('button', { name: copy('scanner.capture.analyze') }).click();
}

export async function fillManualMealItem(
  page: Page,
  options: { name: string; calories: number; weightG?: number },
): Promise<void> {
  const { name, calories, weightG = 100 } = options;
  const nameInput = page.getByPlaceholder(copy('scanner.manual.namePlaceholder'));
  await nameInput.fill(name);
  const card = page.locator('.rounded-xl.border').filter({ has: nameInput });
  await card.locator('input[type="number"]').nth(0).fill(String(weightG));
  await card.locator('input[type="number"]').nth(1).fill(String(calories));
}

export async function logMealAndExpectDashboard(
  page: Page,
  expectedCalories: number,
): Promise<void> {
  await page.getByRole('button', { name: copy('scanner.result.logMeal') }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(
    page.getByRole('link', { name: new RegExp(`${expectedCalories} kcal`) }),
  ).toBeVisible({ timeout: 15_000 });
}
