#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Bundle the webview preview script (React app + three.js) with esbuild. The Tailwind CSS is built
 * separately by the build:preview script (tailwindcss CLI → media/preview.css).
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
  entryPoints: [join(root, 'src', 'preview', 'preview.tsx')],
  jsx: 'automatic',
  bundle: true,
  outfile: outFile,
  format: 'iife',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  // Inline small image resources so they require no separate webview fetch under CSP.
  loader: { '.png': 'dataurl' },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// The shaderball ("totem" geometry, ~1.4MB) is read by the extension host and sent
// over postMessage alongside the document, requiring no separate webview fetch.
const staticAssets = join(root, '..', 'static-assets', 'public', 'viewer');
copyFileSync(join(staticAssets, 'shaderball.glb'), join(outDir, 'shaderball.glb'));

console.log('Built preview.js');

copyFileSync(join(staticAssets, 'default-environment.hdr'), join(outDir, 'default-environment.hdr'));

copyFileSync(join(root, '..', 'viewer', 'LICENSE.model-viewer'), join(outDir, 'LICENSE.model-viewer'));
