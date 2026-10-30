import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
  },
});
