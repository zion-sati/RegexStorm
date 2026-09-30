import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', timeout: 30000,
  use: { baseURL: process.env.TEST_URL || 'http://127.0.0.1:4180/', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: process.env.TEST_URL ? undefined : { command: 'npm run serve', url: 'http://127.0.0.1:4180', reuseExistingServer: !process.env.CI },
});
