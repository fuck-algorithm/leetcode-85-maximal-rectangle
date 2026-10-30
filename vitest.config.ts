import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**', 'test-results/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/algorithm/bruteForce.ts',
        'src/algorithm/divideConquer.ts',
        'src/algorithm/dp.ts',
        'src/algorithm/largestRectangle.ts',
        'src/algorithm/registry.ts',
      ],
      thresholds: { lines: 60, functions: 60, branches: 50 },
    },
  },
});
