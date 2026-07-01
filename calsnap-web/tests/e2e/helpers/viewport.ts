import { expect, type Page } from '@playwright/test';

export const MOBILE_VIEWPORT = { width: 320, height: 568 } as const;

export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize(MOBILE_VIEWPORT);
}

/** documentElement.scrollWidth <= clientWidth + 1px (subpixel tolerance) */
export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

export async function assertRouteReady(
  page: Page,
  heading: string | RegExp,
): Promise<void> {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({
    timeout: 15_000,
  });
}
