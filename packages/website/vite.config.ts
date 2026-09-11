import process from 'node:process';

import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import tailwindcss from '@tailwindcss/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart(),
    sentryTanstackStart({
      org: 'drivecore',
      project: 'mtlx-website',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    react(),
    nitroV2Plugin({
      preset: 'node-server',
      compatibilityDate: '2025-11-07',
      compressPublicAssets: {
        gzip: true,
        brotli: false,
      },
    }),
    tailwindcss(),
  ],
});
