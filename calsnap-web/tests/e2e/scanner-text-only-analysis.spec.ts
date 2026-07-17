import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  logMealAndExpectDashboard,
  mockAnalyzeMeal,
} from './helpers';

test('text-only analysis: description → results → log → dashboard', async ({ page }) => {
  await mockAnalyzeMeal(page);
  await createOnboardedUser(page);

  await page.goto('/scan');

  const description = page.getByPlaceholder(copy('scanner.capture.descriptionPlaceholder'));
  await description.fill('2 eggs, 2 slices toast, coffee with milk');
  await page.getByRole('button', { name: copy('scanner.capture.analyze') }).click();

  await expect(page.getByText('Grilled chicken')).toBeVisible({ timeout: 15_000 });
  await logMealAndExpectDashboard(page, 382);
});

test('analyze failure → retry shows results', async ({ page }) => {
  await mockAnalyzeMeal(page, 503);
  await createOnboardedUser(page);

  await page.goto('/scan');

  const description = page.getByPlaceholder(copy('scanner.capture.descriptionPlaceholder'));
  await description.fill('2 eggs, 2 slices toast');
  await page.getByRole('button', { name: copy('scanner.capture.analyze') }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: copy('scanner.error.api') }),
  ).toBeVisible({ timeout: 15_000 });

  await mockAnalyzeMeal(page);
  await page.getByRole('button', { name: copy('scanner.error.retry') }).click();

  await expect(page.getByText('Grilled chicken')).toBeVisible({ timeout: 15_000 });
});
