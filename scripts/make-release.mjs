#!/usr/bin/env node
// Build and pack only. Publication is deliberately a separate, explicit command.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const packagePath = process.argv[2];
if (!packagePath) throw new Error('Usage: node scripts/make-release.mjs packages/<name>');
const directory = resolve(root, packagePath);
const manifest = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
if (manifest.private) throw new Error('Cannot release a private package');
const destination = resolve(root, 'publish');
mkdirSync(destination, { recursive: true });
const tarball = resolve(destination, `${manifest.name}-${manifest.version}.tgz`);
// Remove incremental metadata and obsolete outputs before compiling this package.
rmSync(resolve(directory, 'dist'), { recursive: true, force: true });
execFileSync('pnpm', ['--filter', `${manifest.name}...`, 'build'], { cwd: root, stdio: 'inherit' });
// pnpm preserves the declared files and rewrites workspace dependency versions.
execFileSync('pnpm', ['pack', '--out', tarball], { cwd: directory, stdio: 'inherit' });
console.log(`Prepared ${tarball}. Run pnpm check:release before publishing.`);
