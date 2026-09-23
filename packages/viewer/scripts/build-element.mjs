#!/usr/bin/env node
/**
 * Self-contained `<material-viewer>` bundle for script-tag embeds (unpkg, jsDelivr, plain HTML):
 * dist/material-viewer.js with three, hdrify and mtlx-core inlined. The tsc output in dist/
 * stays as-is for bundler consumers (`import 'mtlx-viewer/element'`).
 *
 * The shaderball and bridge HDR are fetched from the mtlx website (see src/element.ts); the small
 * studio PNG keeps its `new URL('../assets/…', import.meta.url)` reference, and `assets/` ships in
 * the package next to `dist/`, so that relative path works from a CDN too.
 */
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: [new URL('../src/element.ts', import.meta.url).pathname],
  bundle: true,
  outfile: new URL('../dist/material-viewer.js', import.meta.url).pathname,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
});

console.log('Built dist/material-viewer.js');
