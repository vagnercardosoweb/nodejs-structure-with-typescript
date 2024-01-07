import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

process.env.TZ = 'UTC';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    include: ['**/*.test.ts'],
    bail: process.env.CI === 'true' ? 1 : undefined,
    globalSetup: './src/tests/environment-e2e.ts',
    clearMocks: true,
    allowOnly: true,
    coverage: {
      include: ['src/rest-api/handlers/**/*.ts'],
    },
  },
});
