import { expect, type Page } from '@playwright/test';

export async function waitForDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

export async function gotoAppRoute(page: Page, route: string): Promise<void> {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  await page.goto(normalizedRoute);
}
