import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: [
      'packages/core/src/**/*.test.ts',
      'apps/server/src/**/*.test.ts',
      'packages/web/src/**/*.test.ts',
    ],
    testTimeout: 15000,
  },
})
