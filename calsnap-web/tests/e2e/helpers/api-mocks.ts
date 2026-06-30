import type { Page } from '@playwright/test';
import defaultMealAnalysis from './fixtures/meal-analysis.json';

type MealAnalysisResponse = typeof defaultMealAnalysis;

export async function mockAnalyzeMeal(
  page: Page,
  response: MealAnalysisResponse | number = defaultMealAnalysis,
): Promise<void> {
  await page.route('**/api/analyze-meal', async (route) => {
    if (typeof response === 'number') {
      await route.fulfill({
        status: response,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mock analyze-meal failure' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
