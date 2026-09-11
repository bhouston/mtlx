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
      const packResult = await cli.run(['transform', fixture.materialPath, '-o', fixture.archivePath], {
        timeout: 8_000,
      });
      expect(packResult).toSucceed();
      expect(existsSync(fixture.archivePath)).toBe(true);

      const checkResult = await cli.run(['check', fixture.archivePath], { timeout: 8_000 });
      expect(checkResult).toSucceed();

      const unpackResult = await cli.run(
        ['transform', fixture.archivePath, '-o', path.join(outputDir, 'material.mtlx')],
        { timeout: 8_000 },
      );
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

      const unpackResult = await cli.run(['transform', zipPath, '-o', path.join(outputDir, 'material.mtlx')], {
        timeout: 8_000,
      });
      expect(unpackResult).toSucceed();
      expect(existsSync(path.join(outputDir, 'material.mtlx'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform combines multiple inputs into one output via --output', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-combine-'));
    try {
      const aPath = path.join(tempDir, 'a.mtlx');
      const bPath = path.join(tempDir, 'b.mtlx');
      const outputPath = path.join(tempDir, 'combined.mtlx');
      writeFileSync(
        aPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>',
        'utf8',
      );
      writeFileSync(
        bPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_b" type="material" /></materialx>',
        'utf8',
      );

      const result = await cli.run(['transform', aPath, bPath, '-o', outputPath], { timeout: 8_000 });
      expect(result).toSucceed();

      const info = await cli.run(['info', outputPath, '--format', 'json'], { timeout: 8_000 });
      expect(info).toSucceed();
      expect(
        JSON.parse(info.stdout).materials.toSorted((l: { name: string }, r: { name: string }) =>
          l.name.localeCompare(r.name),
        ),
      ).toEqual([
        { name: 'M_a', category: 'surfacematerial' },
        { name: 'M_b', category: 'surfacematerial' },
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform fails to combine inputs that share a top-level name', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-combine-dup-'));
    try {
      const aPath = path.join(tempDir, 'a.mtlx');
      const bPath = path.join(tempDir, 'b.mtlx');
      const xml =
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>';
      writeFileSync(aPath, xml, 'utf8');
      writeFileSync(bPath, xml, 'utf8');

      const result = await cli.run(['transform', aPath, bPath, '-o', path.join(tempDir, 'out.mtlx')], {
        timeout: 8_000,
      });
      expect(result).toFail();
      expect(result).toHaveStderr(/duplicate top-level name/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("the 'x' alias behaves like transform", async () => {
    const fixture = await makePackFixture();
    try {
      const result = await cli.run(['x', fixture.materialPath, '-o', fixture.archivePath], { timeout: 8_000 });
      expect(result).toSucceed();
      expect(existsSync(fixture.archivePath)).toBe(true);
    } finally {
      await rm(fixture.tempDir, { recursive: true, force: true });
    }
  });

  it('transform batch-converts each input into a directory when --output has no .mtlx(.zip) extension', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-batch-'));
    try {
      const aPath = path.join(tempDir, 'a.mtlx');
      const bPath = path.join(tempDir, 'b.mtlx');
      writeFileSync(
        aPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>',
        'utf8',
      );
      writeFileSync(
        bPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_b" type="material" /></materialx>',
        'utf8',
      );
      const outDir = path.join(tempDir, 'batch-out'); // doesn't exist yet, no .mtlx(.zip) extension

      const result = await cli.run(['transform', aPath, bPath, '-o', outDir], { timeout: 8_000 });
      expect(result).toSucceed();
      expect(existsSync(path.join(outDir, 'a.mtlx'))).toBe(true);
      expect(existsSync(path.join(outDir, 'b.mtlx'))).toBe(true);

      const infoA = await cli.run(['info', path.join(outDir, 'a.mtlx'), '--format', 'json'], { timeout: 8_000 });
      expect(JSON.parse(infoA.stdout).materials).toEqual([{ name: 'M_a', category: 'surfacematerial' }]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform batches into an already-existing directory', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-batch-existing-'));
    try {
      const aPath = path.join(tempDir, 'a.mtlx');
      writeFileSync(
        aPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>',
        'utf8',
      );
      const outDir = path.join(tempDir, 'out');
      await mkdir(outDir, { recursive: true });

      const result = await cli.run(['transform', aPath, '-o', outDir], { timeout: 8_000 });
      expect(result).toSucceed();
      expect(existsSync(path.join(outDir, 'a.mtlx'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform batch mode fails when two inputs would write the same output filename', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-batch-collide-'));
    try {
      await mkdir(path.join(tempDir, 'sub'), { recursive: true });
      const aPath = path.join(tempDir, 'material.mtlx');
      const bPath = path.join(tempDir, 'sub', 'material.mtlx');
      writeFileSync(
        aPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>',
        'utf8',
      );
      writeFileSync(
        bPath,
        '<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_b" type="material" /></materialx>',
        'utf8',
      );

      const result = await cli.run(['transform', aPath, bPath, '-o', path.join(tempDir, 'out')], {
        timeout: 8_000,
      });
      expect(result).toFail();
      expect(result).toHaveStderr(/Two inputs would both write/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform accepts a glob pattern as a single input', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-glob-'));
    try {
      const names = ['metal', 'wood', 'glass'];
      for (const name of names) {
        writeFileSync(
          path.join(tempDir, `${name}.mtlx`),
          `<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_${name}" type="material" /></materialx>`,
          'utf8',
        );
      }
      const outputPath = path.join(tempDir, 'combined.mtlx.zip');

      const result = await cli.run(['transform', path.join(tempDir, '*.mtlx'), '-o', outputPath], {
        timeout: 8_000,
      });
      expect(result).toSucceed();

      const info = await cli.run(['info', outputPath, '--format', 'json'], { timeout: 8_000 });
      expect(
        JSON.parse(info.stdout)
          .materials.map((m: { name: string }) => m.name)
          .toSorted(),
      ).toEqual(['M_glass', 'M_metal', 'M_wood']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform accepts a brace-expansion glob to pick an explicit list of files', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-brace-'));
    try {
      const names = ['metal', 'wood', 'glass', 'skip'];
      for (const name of names) {
        writeFileSync(
          path.join(tempDir, `${name}.mtlx`),
          `<?xml version="1.0"?><materialx version="1.39"><surfacematerial name="M_${name}" type="material" /></materialx>`,
          'utf8',
        );
      }
      const outputPath = path.join(tempDir, 'combined.mtlx.zip');

      const result = await cli.run(['transform', path.join(tempDir, '{metal,wood,glass}.mtlx'), '-o', outputPath], {
        timeout: 8_000,
      });
      expect(result).toSucceed();

      const info = await cli.run(['info', outputPath, '--format', 'json'], { timeout: 8_000 });
      expect(
        JSON.parse(info.stdout)
          .materials.map((m: { name: string }) => m.name)
          .toSorted(),
      ).toEqual(['M_glass', 'M_metal', 'M_wood']);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('transform fails clearly when a glob matches nothing', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-glob-empty-'));
    try {
      const result = await cli.run(
        ['transform', path.join(tempDir, 'nope-*.mtlx'), '-o', path.join(tempDir, 'out.mtlx.zip')],
        { timeout: 8_000 },
      );
      expect(result).toFail();
      expect(result).toHaveStderr(/No files matched/);
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
            '-o',
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

    it('transform --texture-library places loose .mtlx textures in the given directory', async () => {
      const tempDir = await copyFixture('wood_grain');
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const outputDir = path.join(tempDir, 'wood_grain-relocated');
        const result = await cli.run(
          [
            'transform',
            materialPath,
            '-o',
            path.join(outputDir, 'wood_grain.mtlx'),
            '--texture-library',
            'assets/shared',
          ],
          { timeout: 8_000 },
        );
        expect(result).toSucceed();

        expect(existsSync(path.join(outputDir, 'assets/shared/wood_color.jpg'))).toBe(true);
        expect(existsSync(path.join(outputDir, 'assets/shared/wood_roughness.jpg'))).toBe(true);
        expect(existsSync(path.join(outputDir, 'textures'))).toBe(false);

        const xmlText = await readFile(path.join(outputDir, 'wood_grain.mtlx'), 'utf8');
        expect(xmlText).toContain('assets/shared/wood_color.jpg');
        expect(xmlText).not.toContain('textures/wood_color.jpg');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('transform --texture-library accepts a parent-relative (../) directory', async () => {
      const tempDir = await copyFixture('wood_grain');
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const outputDir = path.join(tempDir, 'out', 'nested');
        const sharedDir = path.join(tempDir, 'shared-textures');
        const result = await cli.run(
          [
            'transform',
            materialPath,
            '-o',
            path.join(outputDir, 'wood_grain.mtlx'),
            '--texture-library',
            '../../shared-textures',
          ],
          { timeout: 8_000 },
        );
        expect(result).toSucceed();

        expect(existsSync(path.join(sharedDir, 'wood_color.jpg'))).toBe(true);
        expect(existsSync(path.join(sharedDir, 'wood_roughness.jpg'))).toBe(true);

        const xmlText = await readFile(path.join(outputDir, 'wood_grain.mtlx'), 'utf8');
        expect(xmlText).toContain('../../shared-textures/wood_color.jpg');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('transform --texture-library accepts an absolute directory', async () => {
      const tempDir = await copyFixture('wood_grain');
      const sharedDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-cli-shared-'));
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const outputDir = path.join(tempDir, 'out');
        const result = await cli.run(
          ['transform', materialPath, '-o', path.join(outputDir, 'wood_grain.mtlx'), '--texture-library', sharedDir],
          { timeout: 8_000 },
        );
        expect(result).toSucceed();

        expect(existsSync(path.join(sharedDir, 'wood_color.jpg'))).toBe(true);
        expect(existsSync(path.join(sharedDir, 'wood_roughness.jpg'))).toBe(true);

        const xmlText = await readFile(path.join(outputDir, 'wood_grain.mtlx'), 'utf8');
        expect(xmlText).toContain(`${sharedDir.replace(/\\/g, '/')}/wood_color.jpg`);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
        await rm(sharedDir, { recursive: true, force: true });
      }
    });

    it('transform --texture-library is ignored for .mtlx.zip output (always ./textures)', async () => {
      const tempDir = await copyFixture('wood_grain');
      try {
        const materialPath = path.join(tempDir, 'wood_grain.mtlx');
        const archivePath = path.join(tempDir, 'wood_grain.mtlx.zip');
        const result = await cli.run(
          ['transform', materialPath, '-o', archivePath, '--texture-library', 'assets/shared'],
          { timeout: 8_000 },
        );
        expect(result).toSucceed();
        expect(result.stderr).toContain('--texture-library is ignored for .mtlx.zip output');

        const unpackResult = await cli.run(
          ['transform', archivePath, '-o', path.join(tempDir, 'out', 'wood_grain.mtlx'), '--format', 'json'],
          { timeout: 8_000 },
        );
        expect(unpackResult).toSucceed();
        const unpacked = JSON.parse(unpackResult.stdout);
        expect(unpacked.entries.toSorted()).toEqual(
          ['wood_grain.mtlx', 'textures/wood_color.jpg', 'textures/wood_roughness.jpg'].toSorted(),
        );
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
          ['transform', materialPath, '-o', archivePath, '--max-image-size', '32', '--image-format', 'webp'],
          { timeout: 15_000 },
        );
        expect(packResult).toSucceed();

        const unpackResult = await cli.run(
          ['transform', archivePath, '-o', path.join(tempDir, 'out', 'wood_grain.mtlx'), '--format', 'json'],
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
