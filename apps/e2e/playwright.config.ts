import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter api exec tsx src/index.ts',
      cwd: '../..',
      port: 8080,
      env: { DATABASE_PATH: ':memory:' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter web build && pnpm --filter web preview --port 4173',
      cwd: '../..',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
