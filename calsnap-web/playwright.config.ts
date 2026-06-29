import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'pnpm exec firebase emulators:start --only auth,firestore,storage --project demo-calsnap',
      url: 'http://127.0.0.1:4000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bash -c "cp .env.e2e .env.local && rm -rf .next && pnpm dev"',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
