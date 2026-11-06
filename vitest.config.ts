import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/{cli,core,editor,sdk,viewer,vscode-extension}/src/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/*.d.ts'],
    },
    projects: [
      { test: { fsModuleCache: true, name: 'sdk', include: ['packages/sdk/src/**/*.test.ts'], environment: 'node' } },
      {
        test: {
          fsModuleCache: true,
          name: 'editor',
          include: ['packages/editor/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          fsModuleCache: true,
          name: 'viewer',
          include: ['packages/viewer/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          fsModuleCache: true,
          name: 'core',
          include: ['packages/core/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          fsModuleCache: true,
          name: 'cli',
          include: ['packages/cli/src/**/*.test.ts'],
          environment: 'node',
          // These tests shell out to the CLI with an internal 8s timeout; on a
          // shared CI runner that alone can exceed vitest's 5s default.
          testTimeout: 20_000,
          // beforeAll hooks run pnpm builds, which exceed the 10s default on a loaded machine.
          hookTimeout: 60_000,
        },
      },
      {
        test: {
          fsModuleCache: true,
          name: 'website',
          include: ['packages/website/src/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          // Only files that don't import 'vscode' (unresolvable outside a running extension
          // host) belong here — see mtlxConvert.ts vs. mtlxOperations.ts.
          fsModuleCache: true,
          name: 'vscode-extension',
          include: ['packages/vscode-extension/src/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
