#!/usr/bin/env node
// Writes `mtlx docgen`'s OpenCLI document to packages/cli/opencli.json so it can be committed
// and validated in CI with clidoc-action, mirroring docs:cli's stale-check pattern.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'packages/cli/bin/cli.js');
const docPath = join(root, 'packages/cli/opencli.json');

const generated = execFileSync('node', [cli, 'docgen'], { encoding: 'utf8' });

if (process.argv.includes('--check')) {
  const current = readFileSync(docPath, 'utf8');
  if (generated !== current) throw new Error('OpenCLI document is stale; run pnpm docs:opencli and commit the result');
  console.log('OpenCLI document is current');
} else {
  writeFileSync(docPath, generated);
  console.log(`Updated ${docPath}`);
}
