import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** The existing interactive tools, built as a static app for the documentation artifact. */
export default defineConfig({
  base: '/app/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }, dedupe: ['react', 'react-dom'] },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../docs/static/app',
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('./app.html', import.meta.url)) },
  },
});
