import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./src/config/dotenv'],
    environment: 'node',
    clearMocks: true,
    cache: false
  },
});
