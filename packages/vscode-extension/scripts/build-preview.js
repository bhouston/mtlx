#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Bundle the webview preview script with esbuild.
 * Includes three.js (WebGPURenderer, MaterialXLoader, OrbitControls, RoomEnvironment).
 */
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'media');
const outFile = join(outDir, 'preview.js');

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

await esbuild.build({
  entryPoints: [join(root, 'src', 'preview', 'preview.ts')],
  bundle: true,
  outfile: outFile,
  format: 'iife',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  // Inline the shared studio IBL PNG (from mtlx-viewer) as a data URL, same as three.js itself
  // is bundled into this file — no separate asset file for the webview to fetch under CSP.
  loader: { '.png': 'dataurl' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('Built preview.js');
