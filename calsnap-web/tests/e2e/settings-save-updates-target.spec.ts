import { expect, test } from '@playwright/test';
import { copy } from '@/lib/copy';
import {
  changeActivityLevel,
  createOnboardedUser,
  gotoDashboardFromTab,
  gotoSettings,
  readDashboardCalorieTarget,
  saveSettingsProfile,
} from './helpers';

test('settings activity save decreases dashboard calorie target', async ({ page }) => {
  await createOnboardedUser(page);
  const previousTarget = await readDashboardCalorieTarget(page);

  await gotoSettings(page);
  await expect(
    page.getByRole('radio', { name: copy('common.activity.moderatelyActive.label') }),
  ).toBeChecked();
  await changeActivityLevel(page, 'sedentary');
  await saveSettingsProfile(page);
  await gotoDashboardFromTab(page);

  await expect
    .poll(async () => readDashboardCalorieTarget(page), { timeout: 15_000 })
    .toBeLessThan(previousTarget);
});
