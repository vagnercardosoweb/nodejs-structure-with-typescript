import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    allowOnly: true,
    setupFiles: ['./src/config/dotenv'],
    environment: 'node',
    bail: process.env.CI === 'true' ? 1 : undefined,
    clearMocks: true,
    cache: false
  },
});
