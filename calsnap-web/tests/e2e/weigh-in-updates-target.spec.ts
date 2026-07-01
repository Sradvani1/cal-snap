import { test } from '@playwright/test';
import { createOnboardedUser, logWeighInAndExpectLowerTarget } from './helpers';

test('weigh-in at lower weight decreases dashboard calorie target', async ({ page }) => {
  await createOnboardedUser(page);
  await logWeighInAndExpectLowerTarget(page, 70);
});
