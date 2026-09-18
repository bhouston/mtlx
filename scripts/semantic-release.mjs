// Keep all public packages on one version and publish the exact tested tarballs.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const packages = ['core', 'viewer', 'cli'];
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: 'inherit' });

export function verifyConditions() {
  if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
    throw new Error('Releases require GitHub Actions with id-token: write and npm trusted publishing.');
  }
}

export async function prepare(_config, { cwd, nextRelease, lastRelease }) {
  if (lastRelease.gitTag) {
    const response = await fetch(
      `https://github.com/bhouston/mtlx/releases/download/${encodeURIComponent(lastRelease.gitTag)}/CHANGELOG.md`,
    );
    if (!response.ok) throw new Error(`Cannot restore previous changelog: HTTP ${response.status}`);
    writeFileSync(resolve(cwd, 'CHANGELOG.md'), await response.text());
  }
  for (const name of packages) {
    const path = resolve(cwd, 'packages', name, 'package.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    manifest.version = nextRelease.version;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  rmSync(resolve(cwd, 'publish'), { recursive: true, force: true });
  run('pnpm', ['pack:release'], cwd);
  run('pnpm', ['check:release'], cwd);
  run('pnpm', ['size'], cwd);
}

export function publish(_config, { cwd, nextRelease }) {
  for (const name of packages) {
    run(
      'pnpm',
      ['publish', `publish/mtlx-${name}-${nextRelease.version}.tgz`, '--access', 'public', '--provenance'],
      cwd,
    );
  }
  return { name: 'npm packages', url: 'https://www.npmjs.com/package/mtlx-core' };
}
