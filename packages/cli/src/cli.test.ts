import { execSync } from 'node:child_process';
import { cpSync, existsSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { commandLine, extendMatchers } from 'vitest-command-line';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.resolve(sourceDir, '..');
const repoRoot = path.resolve(cliDir, '../..');
// Real material-samples.com materials, checked in under the repo-root /assets so every
// package's tests (cli, vscode-extension, website) can share the same fixtures.
const fixturesDir = path.join(repoRoot, 'assets');

extendMatchers();

/** Copies a fixture directory (real material-samples.com materials, checked in under the
 * repo-root /assets) into a fresh temp dir so commands can write output alongside it without
 * mutating the fixture. */
const copyFixture = async (name: string): Promise<string> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), `mtlx-cli-${name}-`));
  cpSync(path.join(fixturesDir, name), tempDir, { recursive: true });
  return tempDir;
};

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
  return { tempDir, materialPath, archivePath: path.join(tempDir, 'material.mtlx.zip') };
};

describe('mtlx', () => {
  beforeAll(() => {
    execSync('pnpm --filter mtlx-core build && pnpm --filter mtlx build', {
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
    expect(result).toHaveStdout(/transform/);
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

  it('transform packs to .mtlx.zip, check passes, and transform unpacks back to loose files', async () => {
    const fixture = await makePackFixture();
    const outputDir = path.join(fixture.tempDir, 'out');
    try {
      const packResult = await cli.run(['transform', fixture.materialPath, fixture.archivePath], { timeout: 8_000 });
      expect(packResult).toSucceed();
      expect(existsSync(fixture.archivePath)).toBe(true);

      const checkResult = await cli.run(['check', fixture.archivePath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const unpackResult = await cli.run(['transform', fixture.archivePath, path.join(outputDir, 'material.mtlx')], {
        timeout: 8_000,
      });
      expect(unpackResult).toSucceed();
      expect(existsSync(path.join(outputDir, 'material.mtlx'))).toBe(true);
      expect(existsSync(path.join(outputDir, 'textures/albedo.png'))).toBe(true);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('checks and unpacks an ordinary DEFLATE-compressed .mtlx.zip via transform', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-zip-'));
    const zipPath = path.join(tempDir, 'material.mtlx.zip');
    const outputDir = path.join(tempDir, 'out');
    try {
      const zipped = zipSync({ 'material.mtlx': new TextEncoder().encode(fixtureXml) }, { level: 6 });
      writeFileSync(zipPath, zipped);

      const checkResult = await cli.run(['check', zipPath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const unpackResult = await cli.run(['transform', zipPath, path.join(outputDir, 'material.mtlx')], {
        timeout: 8_000,
      });
      expect(unpackResult).toSucceed();
      expect(existsSync(path.join(outputDir, 'material.mtlx'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('against real material-samples.com fixtures', () => {
    it('check and info pass on the procedural copper.mtlx (no textures)', async () => {
      const materialPath = path.join(fixturesDir, 'copper/copper.mtlx');

      const checkResult = await cli.run(['check', materialPath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const infoResult = await cli.run(['info', materialPath, '--format', 'json'], { timeout: 8_000 });
      expect(infoResult).toSucceed();
      const info = JSON.parse(infoResult.stdout);
      expect(info.materials).toEqual([{ name: 'Copper', category: 'surfacematerial' }]);
      expect(info.referencedTextures).toEqual([]);
    });

    it('info reports the two referenced textures for wood_grain.mtlx', async () => {
      const materialPath = path.join(fixturesDir, 'wood_grain/wood_grain.mtlx');

      const result = await cli.run(['info', materialPath, '--format', 'json'], { timeout: 8_000 });
      expect(result).toSucceed();
      const info = JSON.parse(result.stdout);
      expect(info.referencedTextures.toSorted()).toEqual(
        ['textures/wood_color.jpg', 'textures/wood_roughness.jpg'].toSorted(),
      );
    });

    it('transform --max-image-size --image-format resizes+reformats both wood_grain textures', async () => {
      const tempDir = await copyFixture('wood_grain');
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const outputDir = path.join(tempDir, 'wood_grain-transformed');
        const result = await cli.run(
          [
            'transform',
            materialPath,
            path.join(outputDir, 'wood_grain.mtlx'),
            '--max-image-size',
            '32',
            '--image-format',
            'webp',
          ],
          { timeout: 15_000 },
        );
        expect(result).toSucceed();

        const colorPath = path.join(outputDir, 'textures/wood_color.webp');
        const roughnessPath = path.join(outputDir, 'textures/wood_roughness.webp');
        expect(existsSync(colorPath)).toBe(true);
        expect(existsSync(roughnessPath)).toBe(true);

        const colorMeta = await sharp(colorPath).metadata();
        expect(colorMeta.format).toBe('webp');
        expect(Math.max(colorMeta.width ?? 0, colorMeta.height ?? 0)).toBeLessThanOrEqual(32);

        const xmlText = await readFile(path.join(outputDir, 'wood_grain.mtlx'), 'utf8');
        expect(xmlText).toContain('textures/wood_color.webp');
        expect(xmlText).not.toContain('.jpg');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('transform to .mtlx.zip with texture flags resizes textures inside the archive', async () => {
      const tempDir = await copyFixture('wood_grain');
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const archivePath = path.join(tempDir, 'wood_grain.mtlx.zip');
        const packResult = await cli.run(
          ['transform', materialPath, archivePath, '--max-image-size', '32', '--image-format', 'webp'],
          { timeout: 15_000 },
        );
        expect(packResult).toSucceed();

        const unpackResult = await cli.run(
          ['transform', archivePath, path.join(tempDir, 'out', 'wood_grain.mtlx'), '--format', 'json'],
          { timeout: 8_000 },
        );
        expect(unpackResult).toSucceed();
        const unpacked = JSON.parse(unpackResult.stdout);
        expect(unpacked.entries.toSorted()).toEqual(
          ['wood_grain.mtlx', 'textures/wood_color.webp', 'textures/wood_roughness.webp'].toSorted(),
        );
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
