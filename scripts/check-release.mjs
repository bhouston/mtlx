#!/usr/bin/env node
// Exercise the actual tarballs in a clean production consumer, outside the workspace.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mtlx-release-check-'));
try {
  const tarballs = ['core', 'viewer', 'cli'].map((name) => {
    const pkg = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
    return join(root, 'publish', `${pkg.name}-${pkg.version}.tgz`);
  });
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', ...tarballs], {
    cwd: directory,
    stdio: 'inherit',
  });
  for (const name of ['core', 'viewer', 'cli']) {
    const files = readdirSync(join(directory, 'node_modules', `mtlx-${name}`, 'dist'), { recursive: true });
    assert.ok(
      files.every((file) => !String(file).includes('.test.') && !String(file).endsWith('.tsbuildinfo')),
      `${name} must not ship tests or incremental metadata`,
    );
  }
  const cli = join(directory, 'node_modules/mtlx-cli/bin/cli.js');
  const run = (args) => execFileSync(process.execPath, [cli, ...args], { cwd: directory, encoding: 'utf8' });
  assert.match(run(['--help']), /check/);
  writeFileSync(
    join(directory, 'sample.mtlx'),
    '<materialx version="1.39"><constant name="value" type="float"><input name="value" type="float" value="1" /></constant></materialx>',
  );
  run(['check', 'sample.mtlx']);
  const dryRun = JSON.parse(
    run(['x', 'sample.mtlx', '-o', 'dry-run/output.mtlx.zip', '--dry-run', '--format', 'json']),
  );
  assert.equal(dryRun.success, true);
  assert.equal(dryRun.bytesWritten, 0);
  assert.equal(existsSync(join(directory, 'dry-run')), false);
  run(['x', 'sample.mtlx', '-o', 'sample.mtlx.zip']);
  run(['check', 'sample.mtlx.zip']);
  run(['x', 'sample.mtlx.zip', '-o', 'unpacked.mtlx']);
  // Direct server invocation avoids opening a user's browser while checking packaged assets.
  const consumer = `
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startViewServer } from './node_modules/mtlx-cli/dist/view/server.js';
import { parseMaterialX } from 'mtlx-core';
assert.equal(parseMaterialX('<materialx version="1.39"/>').attributes.version, '1.39');
await readFile(new URL(import.meta.resolve('mtlx-viewer/assets/shaderball.glb')));
await readFile(new URL(import.meta.resolve('mtlx-viewer/assets/studio-environment.png')));
const server = await startViewServer('sample.mtlx');
try {
  for (const route of ['/', '/__mtlx_view__/viewer.js', '/__mtlx_view__/shaderball.glb']) {
    const response = await fetch(new URL(route, server.url));
    assert.equal(response.status, 200, route);
    assert.ok((await response.arrayBuffer()).byteLength > 0, route);
  }
} finally { await server.close(); }
`;
  writeFileSync(join(directory, 'check.mjs'), consumer);
  execFileSync(process.execPath, ['check.mjs'], { cwd: directory, stdio: 'inherit' });
  console.log('Clean production tarball checks passed: help, check, transform, viewer routes, and exported assets.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
