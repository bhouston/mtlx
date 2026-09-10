import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';
import { commandLine, extendMatchers } from 'vitest-command-line';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(sourceDir, '..');
const repoRoot = path.resolve(cliDir, '../..');

extendMatchers();

const fixtureXml = `<?xml version="1.0"?>
<materialx version="1.39">
  <nodegraph name="NG_test">
    <image name="albedo" type="color3">
      <input name="file" type="filename" value="textures/albedo.png" />
    </image>
  </nodegraph>
  <surfacematerial name="M_test" type="material" />
</materialx>`;

const makePackFixture = async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-pack-'));
  await mkdir(path.join(tempDir, 'textures'), { recursive: true });
  const materialPath = path.join(tempDir, 'material.mtlx');
  const texturePath = path.join(tempDir, 'textures/albedo.png');
  writeFileSync(materialPath, fixtureXml, 'utf8');
  writeFileSync(texturePath, new Uint8Array([137, 80, 78, 71]));
  return { tempDir, materialPath, archivePath: path.join(tempDir, 'material.mtlz') };
};

describe('mtlx', () => {
  beforeAll(() => {
    execSync('pnpm --filter @mtlx/core build && pnpm --filter @mtlx/cli build', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  });

  const cli = commandLine({
    command: ['node', 'bin/cli.js'],
    name: 'mtlx',
    cwd: cliDir,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  it('prints version with --version', async () => {
    const result = await cli.run(['--version'], { timeout: 8_000 });
    expect(result).toSucceed();
    expect(result).toHaveStdout(/^\d+\.\d+\.\d+/);
  });

  it('shows available commands in --help', async () => {
    const result = await cli.run(['--help'], { timeout: 8_000 });
    expect(result).toSucceed();
    expect(result).toHaveStdout(/info/);
    expect(result).toHaveStdout(/check/);
    expect(result).toHaveStdout(/pack/);
    expect(result).toHaveStdout(/unpack/);
  });

  it('info --format json reports materials and referenced textures', async () => {
    const fixture = await makePackFixture();
    try {
      const result = await cli.run(['info', fixture.materialPath, '--format', 'json'], { timeout: 8_000 });
      expect(result).toSucceed();
      const info = JSON.parse(result.stdout);
      expect(info.materials).toEqual([{ name: 'M_test', category: 'surfacematerial' }]);
      expect(info.referencedTextures).toEqual(['textures/albedo.png']);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('info --format yaml is valid yaml text', async () => {
    const fixture = await makePackFixture();
    try {
      const result = await cli.run(['info', fixture.materialPath, '--format', 'yaml'], { timeout: 8_000 });
      expect(result).toSucceed();
      expect(result).toHaveStdout(/version:/);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('check command succeeds on known fixture', async () => {
    const fixture = await makePackFixture();
    try {
      const result = await cli.run(['check', fixture.materialPath], { timeout: 8_000 });
      expect(result).toSucceed();
      expect(result).toHaveStdout(/Check passed|WARNING/);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('check command fails on malformed XML', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-invalid-'));
    const invalidPath = path.join(tempDir, 'invalid.mtlx');
    try {
      writeFileSync(invalidPath, '<materialx><nodegraph></materialx>', 'utf8');
      const result = await cli.run(['check', invalidPath], { timeout: 8_000 });
      expect(result).toFail();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('packs, checks, and unpacks a .mtlz archive', async () => {
    const fixture = await makePackFixture();
    const outputDir = path.join(fixture.tempDir, 'out');
    try {
      const packResult = await cli.run(['pack', fixture.materialPath, '--output', fixture.archivePath], {
        timeout: 8_000,
      });
      expect(packResult).toSucceed();
      expect(existsSync(fixture.archivePath)).toBe(true);

      const checkResult = await cli.run(['check', fixture.archivePath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const unpackResult = await cli.run(['unpack', fixture.archivePath, '--output-dir', outputDir], {
        timeout: 8_000,
      });
      expect(unpackResult).toSucceed();
      expect(existsSync(path.join(outputDir, 'material.mtlx'))).toBe(true);
      expect(existsSync(path.join(outputDir, 'textures/albedo.png'))).toBe(true);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('checks and unpacks an ordinary DEFLATE-compressed .mtlx.zip', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-zip-'));
    const zipPath = path.join(tempDir, 'material.mtlx.zip');
    const outputDir = path.join(tempDir, 'out');
    try {
      const zipped = zipSync({ 'material.mtlx': new TextEncoder().encode(fixtureXml) }, { level: 6 });
      writeFileSync(zipPath, zipped);

      const checkResult = await cli.run(['check', zipPath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const unpackResult = await cli.run(['unpack', zipPath, '--output-dir', outputDir], { timeout: 8_000 });
      expect(unpackResult).toSucceed();
      expect(existsSync(path.join(outputDir, 'material.mtlx'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
