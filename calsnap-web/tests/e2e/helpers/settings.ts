import { expect, type Page } from '@playwright/test';
import type { ActivityLevel } from '@/lib/models/activity-level';
import { copy } from '@/lib/copy';
import { gotoAppRoute } from './navigation';

export async function gotoSettings(page: Page): Promise<void> {
  await gotoAppRoute(page, '/settings');
  await expect(
    page.getByRole('heading', { name: copy('settings.title') }),
  ).toBeVisible();
}

export async function changeActivityLevel(
  page: Page,
  level: ActivityLevel,
): Promise<void> {
  await page
    .getByRole('radio', { name: copy(`common.activity.${level}.label`) })
    .check();
}

export async function saveSettingsProfile(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: copy('settings.saveProfile') });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(btn).toBeHidden({ timeout: 15_000 });
}

export async function openDeleteAllDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: copy('settings.data.deleteAll') }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByText(copy('settings.deleteDialog.title'))).toBeVisible();
}

export async function confirmDeleteAllData(page: Page): Promise<void> {
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: copy('common.button.delete') })
    .click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
}

export async function gotoDashboardFromTab(page: Page): Promise<void> {
  await page
    .getByRole('navigation', { name: copy('common.nav.main') })
    .getByRole('link', { name: copy('common.nav.dashboard') })
    .click();
  await expect(page).toHaveURL(/\/dashboard/);
}
