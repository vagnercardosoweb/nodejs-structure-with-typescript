import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: [...configDefaults.exclude, '**/tests/**'],
    bail: process.env.CI === 'true' ? 1 : undefined,
    setupFiles: './src/tests/default-env',
    clearMocks: true,
    allowOnly: true,
  },
});
