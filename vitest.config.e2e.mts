import tsconfigPaths from 'vite-tsconfig-paths';
import {configDefaults, defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    include: ['**/*.test.ts'],
    exclude: [...configDefaults.exclude, '**/tests/**'],
    bail: process.env.CI === 'true' ? 1 : undefined,
    globalSetup: './src/tests/environment-e2e.ts',
    clearMocks: true,
    allowOnly: true,
  },
});
