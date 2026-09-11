import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
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
