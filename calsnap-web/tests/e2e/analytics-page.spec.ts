import { test, expect } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  createOnboardedUser,
  expectAnalyticsDietarySections,
  expectAnalyticsEmptyState,
  expectGenerateInsightUnavailable,
  gotoAnalyticsFromProgress,
  seedMealsOnDistinctDays,
} from './helpers';

test('analytics empty state with zero meals shows weight section and no insight action', async ({
  page,
}) => {
  await createOnboardedUser(page);
  await gotoAnalyticsFromProgress(page);

  await expectAnalyticsEmptyState(page);
  await expect(
    page.getByRole('heading', { name: copy('analytics.section.weightProgress'), level: 2 }),
  ).toBeVisible({ timeout: 15_000 });
  await expectGenerateInsightUnavailable(page);
});

test('analytics shows dietary sections after meals on distinct days', async ({ page }) => {
  const credentials = await createOnboardedUser(page);
  await seedMealsOnDistinctDays(credentials, 3);
  await gotoAnalyticsFromProgress(page);

  await expectAnalyticsDietarySections(page);

  await page.getByRole('button', { name: copy('analytics.timeframe.30d') }).click();
  await expectAnalyticsDietarySections(page);
});
