import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  assertNoHorizontalScroll,
  assertRouteReady,
  createOnboardedUser,
  gotoAppRoute,
  gotoSettings,
  setMobileViewport,
  signUpWithEmail,
} from './helpers';

test.describe('320px viewport — no horizontal scroll', () => {
  test.beforeEach(async ({ page }) => {
    await setMobileViewport(page);
  });

  test('login page fits at 320px', async ({ page }) => {
    await page.goto('/login');
    await assertRouteReady(page, copy('auth.login.title'));
    await assertNoHorizontalScroll(page);
  });

  test('onboarding fits at 320px', async ({ page }) => {
    await signUpWithEmail(page);
    await assertNoHorizontalScroll(page);
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('dashboard fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await assertNoHorizontalScroll(page);
    await expect(
      page.getByRole('progressbar', {
        name: copy('designSystem.calorieRing.accessibility.label'),
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: copy('common.nav.main') }),
    ).toBeVisible();
  });

  test('log page fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await gotoAppRoute(page, '/log');
    await assertNoHorizontalScroll(page);
    await expect(page.getByRole('heading', { name: copy('mealLog.title') })).toBeVisible();
  });

  test('settings fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await gotoSettings(page);
    await assertNoHorizontalScroll(page);
  });

  test('scan page fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await gotoAppRoute(page, '/scan');
    await assertNoHorizontalScroll(page);
    await assertRouteReady(page, copy('scanner.title'));
  });

  test('progress page fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await gotoAppRoute(page, '/progress');
    await assertNoHorizontalScroll(page);
    await assertRouteReady(page, copy('progress.title'));
  });

  test('analytics page fits at 320px', async ({ page }) => {
    await createOnboardedUser(page);
    await gotoAppRoute(page, '/analytics');
    await assertNoHorizontalScroll(page);
    await assertRouteReady(page, copy('analytics.title'));
  });
});
