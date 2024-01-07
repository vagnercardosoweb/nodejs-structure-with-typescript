process.env.TZ = 'UTC';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    bail: process.env.CI === 'true' ? 1 : undefined,
    setupFiles: './src/tests/default-env',
    clearMocks: true,
    allowOnly: true,
    coverage: {
      include: [
        'src/shared/**/*.ts',
        'src/rest-api/middlewares/**/*.ts',
        'src/repositories/**/*.ts',
        'src/services/**/*.ts',
        'src/events/**/*.ts',
        '!src/shared/enums/*.ts',
        '!src/rest-api/handlers/**/*.ts',
        '!src/**/index.ts',
      ],
    },
  },
});
