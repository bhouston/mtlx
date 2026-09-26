#!/usr/bin/env node
// Exercise the actual tarballs in a clean production consumer, outside the workspace.
import assert from 'node:assert/strict';
import { checkReadmeExamples } from './check-readme.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mtlx-release-check-'));
try {
  const tarballs = ['core', 'viewer', 'sdk', 'cli'].map((name) => {
    const pkg = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
    return join(root, 'publish', `${pkg.name}-${pkg.version}.tgz`);
  });
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  // Verify the core session before viewer dependencies can supply React accidentally.
  execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', tarballs[0]], {
    cwd: directory,
    stdio: 'inherit',
  });
  const headlessConsumer = `
import assert from 'node:assert/strict';
import { parseMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';
// The installed headless session must not rely on editor packages or browser globals.
for (const dependency of ['mtlx-editor', 'react', 'react-dom', '@xyflow/react'])
  assert.throws(() => import.meta.resolve(dependency), { code: 'ERR_MODULE_NOT_FOUND' });
assert.equal(typeof document, 'undefined');
const session = createEditorSession({ document: parseMaterialX('<materialx version="1.39"/>') });
const before = session.getDocument();
const id = session.transaction('Create constant', () => {
  const created = session.graph().addNode({ definition: 'ND_constant_float' });
  session.graph().setInputValue(created, 'value', 0.5, { type: 'float' });
  return created;
});
assert.equal(session.graph().getInputs(id)[0].value, '0.5');
assert.ok(Object.isFrozen(session.getDocument().elements[0].attributes));
assert.ok(!('position' in session.graph().getNode(id)));
session.undo();
assert.equal(session.getDocument(), before);
`;
  writeFileSync(join(directory, 'check-session.mjs'), headlessConsumer);
  execFileSync(process.execPath, ['check-session.mjs'], { cwd: directory, stdio: 'inherit' });
  execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', ...tarballs.slice(1)], {
    cwd: directory,
    stdio: 'inherit',
  });
  for (const [name, packageName] of [
    ['core', 'mtlx-core'],
    ['viewer', 'mtlx-viewer'],
    ['sdk', 'mtlx-sdk'],
    ['cli', 'mtlx-cli'],
  ]) {
    const files = readdirSync(join(directory, 'node_modules', packageName, 'dist'), { recursive: true });
    assert.ok(
      files.every((file) => !String(file).includes('.test.') && !String(file).endsWith('.tsbuildinfo')),
      `${name} must not ship tests or incremental metadata`,
    );
  }
  const cli = join(directory, 'node_modules/mtlx-cli/bin/cli.js');
  const run = (args) => execFileSync(process.execPath, [cli, ...args], { cwd: directory, encoding: 'utf8' });
  assert.match(run(['--help']), /check/);
  assert.match(run(['--help']), /materials/);
  assert.match(run(['auth', '--help']), /login/);
  const sdkConsumer = `
import assert from 'node:assert/strict';
import { createAnonymousClient } from 'mtlx-sdk';
assert.equal(typeof createAnonymousClient, 'function');
`;
  writeFileSync(join(directory, 'check-sdk.mjs'), sdkConsumer);
  execFileSync(process.execPath, ['check-sdk.mjs'], { cwd: directory, stdio: 'inherit' });
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
  checkReadmeExamples(directory);
  console.log(
    'Clean production tarball checks passed: headless session, help, check, transform, viewer routes, and exported assets.',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
