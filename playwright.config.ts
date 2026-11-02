import { defineConfig, devices } from '@playwright/test';
const base = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: base ?? 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: base ? undefined : { command: 'npx next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-narrow', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
  ],
});
