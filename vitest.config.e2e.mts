import tsconfigPaths from 'vite-tsconfig-paths';
import {configDefaults, defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    allowOnly: true,
    environment: './src/tests/environment-e2e.ts',
    include: ['**/*.test.ts'],
    exclude: [...configDefaults.exclude, '**/tests/**'],
    bail: process.env.CI === 'true' ? 1 : undefined,
    clearMocks: true,
  },
});
