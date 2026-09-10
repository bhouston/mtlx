#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Bundle the extension with esbuild, including mtlx-core.
 * Output: dist/extension.js (self-contained, no node_modules needed at runtime)
 */
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'dist');
const outFile = join(outDir, 'extension.js');

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
} else {
  for (const f of readdirSync(outDir)) {
    unlinkSync(join(outDir, f));
  }
}

await esbuild.build({
  entryPoints: [join(root, 'src', 'extension.ts')],
  bundle: true,
  outfile: outFile,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode', 'sharp'],
  sourcemap: true,
  minify: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log('Built extension.js (bundled with mtlx-core)');
