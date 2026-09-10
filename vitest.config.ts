import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
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
    ],
  },
});
