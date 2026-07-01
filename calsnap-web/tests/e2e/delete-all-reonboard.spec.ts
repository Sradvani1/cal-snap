import { expect, test } from '@playwright/test';
import {
  completeOnboarding,
  confirmDeleteAllData,
  createOnboardedUser,
  gotoSettings,
  openDeleteAllDialog,
} from './helpers';

test('delete all data returns to onboarding and can re-onboard', async ({ page }) => {
  await createOnboardedUser(page);

  await gotoSettings(page);
  await openDeleteAllDialog(page);
  await confirmDeleteAllData(page);

  await completeOnboarding(page);
  await expect(page).toHaveURL(/\/dashboard/);
});
