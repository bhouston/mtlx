import tailwindcss from '@tailwindcss/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** Dev only: vite serves public/ files but not a directory index, so /docs/ (the TypeDoc
 * output) would fall through to the router and 404/500. Nitro handles this in production. */
const docsIndex: Plugin = {
  name: 'docs-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/docs') {
        res.writeHead(301, { Location: '/docs/' });
        res.end();
        return;
      }
      if (req.url === '/docs/') {
        req.url = '/docs/index.html';
      }
      next();
    });
  },
};

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    docsIndex,
    tanstackStart(),
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
