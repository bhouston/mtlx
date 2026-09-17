import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/generated/**', '**/routeTree.gen.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: { statements: 56, branches: 53, functions: 49, lines: 57 },
    },
    projects: [
      { test: { name: 'editor', include: ['packages/editor/src/**/*.test.ts'], environment: 'node' } },
      {
        test: { name: 'viewer', include: ['packages/viewer/src/**/*.test.ts'], environment: 'node' },
      },
      {
        test: {
          name: 'core',
          include: ['packages/core/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'cli',
          testTimeout: 30_000,
          include: ['packages/cli/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'website',
          include: ['packages/website/src/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          // Only files that don't import 'vscode' (unresolvable outside a running extension
          // host) belong here — see mtlxConvert.ts vs. mtlxOperations.ts.
          name: 'vscode-extension',
          include: ['packages/vscode-extension/src/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
