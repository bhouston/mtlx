import { execFile, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const cli = path.join(root, 'packages/cli/bin/cli.js');
const execute = promisify(execFile);
let dir: string;
beforeAll(() => {
  execFileSync('pnpm', ['exec', 'tsc', '-b', 'packages/core', 'packages/cli'], { cwd: root, stdio: 'pipe' });
});
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlx-dry-run-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('CLI dry runs', () => {
  it('prints a JSON write plan and leaves an absent output directory absent', async () => {
    const input = path.join(dir, 'input.mtlx');
    const xml = '<materialx version="1.39"><standard_surface name="surface" type="surfaceshader"/></materialx>';
    await writeFile(input, xml);
    const { stdout } = await execute(process.execPath, [
      cli,
      'x',
      input,
      '-o',
      path.join(dir, 'absent/output.mtlx.zip'),
      '--dry-run',
      '--format',
      'json',
    ]);
    const result = JSON.parse(stdout);
    expect(result).toMatchObject({ success: true, dryRun: true, bytesWritten: 0 });
    expect(result.changes[0]).toMatchObject({ action: 'write' });
    expect(result.stages.find((stage: { name: string }) => stage.name === 'commit').status).toBe('skipped');
    expect(await readdir(dir)).toEqual(['input.mtlx']);
    expect(await readFile(input, 'utf8')).toBe(xml);
  });

  it('reserves shared texture paths across batch dry runs without writing them', async () => {
    for (const [index, name] of ['first', 'second'].entries()) {
      const inputDir = path.join(dir, name);
      await mkdir(inputDir);
      await writeFile(
        path.join(inputDir, 'material.mtlx'),
        '<materialx version="1.39"><image name="image" type="color3"><input name="file" type="filename" value="texture.png"/></image></materialx>',
      );
      await writeFile(path.join(inputDir, 'texture.png'), new Uint8Array([index]));
    }
    const { stdout } = await execute(process.execPath, [
      cli,
      'x',
      path.join(dir, '*/*.mtlx'),
      '-o',
      path.join(dir, 'output'),
      '--texture-library',
      path.join(dir, 'shared'),
      '--dry-run',
      '--format',
      'json',
    ]);
    const batch = JSON.parse(stdout);
    expect(batch).toMatchObject({ kind: 'batch', success: true, total: 2, failed: 0 });
    const results = batch.results;
    expect(results).toHaveLength(2);
    expect(results.every((result: { success: boolean }) => result.success)).toBe(true);
    const texturePaths = results
      .flatMap((result: { changes: Array<{ path: string }> }) => result.changes.map((change) => change.path))
      .filter((file: string) => file.endsWith('.png'));
    expect(new Set(texturePaths).size).toBe(2);
    expect(texturePaths.some((file: string) => file.endsWith('texture-2.png'))).toBe(true);
    expect((await readdir(dir)).toSorted()).toEqual(['first', 'second']);
  });

  it('returns structured failure output and a nonzero status for malformed input', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, '<materialx>');
    try {
      await execute(process.execPath, [
        cli,
        'x',
        input,
        '-o',
        path.join(dir, 'out.mtlx'),
        '--dry-run',
        '--format',
        'json',
      ]);
      throw new Error('Expected the CLI to fail');
    } catch (error) {
      const failure = error as Error & { stdout: string; code: number };
      expect(failure.code).toBe(1);
      expect(JSON.parse(failure.stdout)).toMatchObject({
        success: false,
        errors: [expect.objectContaining({ stage: 'parse' })],
      });
    }
    expect(await readdir(dir)).toEqual(['input.mtlx']);
  });
});

it('reports every batch failure in JSON and still writes later valid inputs', async () => {
  const bad = path.join(dir, 'broken.mtlx');
  const good = path.join(dir, 'good.mtlx');
  await writeFile(bad, '<materialx>');
  await writeFile(good, '<materialx version="1.39"/>');
  const output = path.join(dir, 'out');
  const failure = await execute(process.execPath, [cli, 'x', bad, good, '-o', output, '--format', 'json']).then(
    () => {
      throw new Error('Expected nonzero exit');
    },
    (error) => error as { code: number; stdout: string },
  );
  expect(failure.code).toBe(1);
  const batch = JSON.parse(failure.stdout);
  expect(batch).toMatchObject({ schemaVersion: 1, kind: 'batch', success: false, total: 2, succeeded: 1, failed: 1 });
  expect(batch.failures).toEqual([expect.objectContaining({ input: bad, message: expect.any(String) })]);
  expect(batch.results.map((result: { success: boolean }) => result.success)).toEqual([false, true]);
  expect(await readFile(path.join(output, 'good.mtlx'), 'utf8')).toContain('materialx');
});
