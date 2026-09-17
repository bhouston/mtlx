import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import config from '../release.config.js';

test('release types follow Conventional Commits, including breaking changes', async () => {
  const logger = { log() {} };
  for (const [message, expected] of [
    ['fix(core): handle empty input', 'patch'],
    ['feat(cli): add export', 'minor'],
    ['feat(core)!: change parser output', 'major'],
    ['refactor: change parser\n\nBREAKING CHANGE: output shape changed', 'major'],
    ['docs: clarify usage', null],
  ]) {
    assert.equal(
      await analyzeCommits(
        { preset: 'conventionalcommits' },
        { cwd: process.cwd(), commits: [{ message, hash: 'test' }], logger },
      ),
      expected,
    );
  }
  assert.deepEqual(config.branches, ['main']);
});

test('PR policy accepts issue branches and dev promotions, rejects bypasses', () => {
  const temp = mkdtempSync(join(tmpdir(), 'mtlx-policy-'));
  try {
    const path = join(temp, 'event.json');
    for (const [base, head, repo, body, accepted] of [
      ['dev', 'feature/42-export', 'someone/fork', 'Closes #42', true],
      ['dev', 'fix/42-export', 'bhouston/mtlx', 'Fixes #42', true],
      ['dev', 'feature/42-export', 'bhouston/mtlx', 'Closes #420', false],
      ['dev', 'feature/export', 'bhouston/mtlx', 'Closes #42', false],
      ['main', 'dev', 'bhouston/mtlx', '', true],
      ['main', 'dev', 'someone/fork', '', false],
      ['main', 'feature/42-export', 'bhouston/mtlx', 'Closes #42', false],
    ]) {
      writeFileSync(
        path,
        JSON.stringify({
          repository: { full_name: 'bhouston/mtlx' },
          pull_request: { base: { ref: base }, head: { ref: head, repo: { full_name: repo } }, body },
        }),
      );
      const result = spawnSync(process.execPath, ['scripts/check-pr.mjs'], {
        env: { ...process.env, GH_TOKEN: '', GITHUB_EVENT_PATH: path },
        encoding: 'utf8',
      });
      assert.equal(result.status === 0, accepted, `${base} <- ${head}: ${result.stderr}`);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('release preparation checks before publishing and uses synchronized exact tarballs', async () => {
  const { prepare, publish, verifyConditions } = await import('./semantic-release.mjs');
  const { mkdirSync, readFileSync, chmodSync } = await import('node:fs');
  const temp = mkdtempSync(join(tmpdir(), 'mtlx-release-test-'));
  const previousPath = process.env.PATH;
  try {
    mkdirSync(join(temp, 'bin'));
    for (const command of ['pnpm', 'npm']) {
      const path = join(temp, 'bin', command);
      writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' "${command} $*" >> '${temp}/commands'\n`);
      chmodSync(path, 0o755);
    }
    process.env.PATH = `${temp}/bin:${previousPath}`;
    for (const name of ['core', 'viewer', 'cli']) {
      mkdirSync(join(temp, 'packages', name), { recursive: true });
      writeFileSync(
        join(temp, 'packages', name, 'package.json'),
        JSON.stringify({ name: `mtlx-${name}`, version: '0.6.0', dependencies: { 'mtlx-core': 'workspace:*' } }),
      );
    }
    const context = { cwd: temp, nextRelease: { version: '1.2.3' }, lastRelease: {} };
    await prepare({}, context);
    for (const name of ['core', 'viewer', 'cli']) {
      const manifest = JSON.parse(readFileSync(join(temp, 'packages', name, 'package.json')));
      assert.equal(manifest.version, '1.2.3');
      assert.equal(manifest.dependencies['mtlx-core'], 'workspace:*');
    }
    assert.equal(readFileSync(join(temp, 'commands'), 'utf8'), 'pnpm pack:release\npnpm check:release\npnpm size\n');
    publish({}, context);
    assert.deepEqual(
      readFileSync(join(temp, 'commands'), 'utf8').trim().split('\n').slice(3),
      ['core', 'viewer', 'cli'].map(
        (name) => `npm publish publish/mtlx-${name}-1.2.3.tgz --access public --provenance`,
      ),
    );
    writeFileSync(join(temp, 'bin', 'pnpm'), '#!/bin/sh\nexit 1\n');
    await assert.rejects(prepare({}, context));
    if (!process.env.GITHUB_ACTIONS) assert.throws(() => verifyConditions(), /GitHub Actions/);
  } finally {
    process.env.PATH = previousPath;
    rmSync(temp, { recursive: true, force: true });
  }
});
