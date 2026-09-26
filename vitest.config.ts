import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    projects: [
      { test: { name: 'sdk', include: ['packages/sdk/src/**/*.test.ts'], environment: 'node' } },
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
          include: ['packages/cli/src/**/*.test.ts'],
          environment: 'node',
          // These tests shell out to the CLI with an internal 8s timeout; on a
          // shared CI runner that alone can exceed vitest's 5s default.
          testTimeout: 20_000,
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
