#!/usr/bin/env node
/**
 * Bundle the `mtlx view` browser-side viewer script with esbuild — same pattern as the VS Code
 * extension's build-preview.js (three.js WebGPURenderer, MaterialXLoader, GLTFLoader,
 * OrbitControls, all in one iife).
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
// viewer.js is a build output (bundled from viewerEntry.ts), so it lives in dist/ next to the
// compiled server.js it's served alongside — not in media/, which holds the checked-in-at-build
// binary asset (shaderball.glb) copied in below.
const jsOutDir = join(root, 'dist', 'view');
const outFile = join(jsOutDir, 'viewer.js');
const mediaDir = join(root, 'media');

for (const dir of [jsOutDir, mediaDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

await esbuild.build({
  entryPoints: [join(root, 'src', 'view', 'viewerEntry.ts')],
  bundle: true,
  outfile: outFile,
  format: 'iife',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  // Inline the shared studio IBL PNG (from mtlx-viewer) as a data URL — no separate asset route
  // for the local server to serve.
  loader: { '.png': 'dataurl' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// The shaderball ("totem" geometry, ~1.4MB) is too big to inline as a data URL — copied into
// media/ instead and served at /__mtlx_view__/shaderball.glb (see ../src/view/server.ts).
copyFileSync(fileURLToPath(import.meta.resolve('mtlx-viewer/assets/shaderball.glb')), join(mediaDir, 'shaderball.glb'));

console.log('Built viewer.js');
