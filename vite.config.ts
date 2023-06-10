import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    clearMocks: true,
    setupFiles: ['./vite.setup.ts'],
    passWithNoTests: true,
    environment: 'node',
  },
});
