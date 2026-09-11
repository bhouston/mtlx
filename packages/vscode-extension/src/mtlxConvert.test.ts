import { cpSync, existsSync } from 'node:fs';
import { mkdtemp, readdir, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { convertMaterialXFile, convertMaterialXFiles, outputPathFor } from './mtlxConvert.js';

// Real material-samples.com materials, shared with the CLI's and website's tests via the
// repo-root /assets rather than duplicated per package.
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../assets');

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlxconvert-test-fixture-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('outputPathFor', () => {
  it('swaps the extension for each target format', () => {
    expect(outputPathFor('/a/b/material.mtlx', 'mtlx.zip')).toBe('/a/b/material.mtlx.zip');
    expect(outputPathFor('/a/b/material.mtlx.zip', 'mtlx')).toBe('/a/b/material.mtlx');
  });
});

describe('convertMaterialXFile', () => {
  it('rejects converting a file to its own format', async () => {
    await expect(convertMaterialXFile('/a/b/material.mtlx', 'mtlx')).rejects.toThrow(/already mtlx/);
  });

  it('mtlx -> mtlx.zip -> mtlx round-trips the procedural copper fixture', async () => {
    cpSync(path.join(fixturesDir, 'copper'), dir, { recursive: true });
    const materialPath = path.join(dir, 'copper.mtlx');

    const zipPath = await convertMaterialXFile(materialPath, 'mtlx.zip');
    expect(zipPath).toBe(path.join(dir, 'copper.mtlx.zip'));
    expect(existsSync(zipPath)).toBe(true);

    const backToMtlxPath = await convertMaterialXFile(zipPath, 'mtlx');
    expect(existsSync(backToMtlxPath)).toBe(true);
  });

  it('mtlx -> mtlx.zip carries along referenced textures (wood_grain fixture)', async () => {
    cpSync(path.join(fixturesDir, 'wood_grain'), dir, { recursive: true });
    const materialPath = path.join(dir, 'wood_grain.mtlx');

    const zipPath = await convertMaterialXFile(materialPath, 'mtlx.zip');
    expect(zipPath).toBe(path.join(dir, 'wood_grain.mtlx.zip'));
    expect(existsSync(zipPath)).toBe(true);
  });

  it('mtlx.zip -> mtlx converts without leaving a temp dir behind', async () => {
    cpSync(path.join(fixturesDir, 'wood_grain'), dir, { recursive: true });
    const zipPath = await convertMaterialXFile(path.join(dir, 'wood_grain.mtlx'), 'mtlx.zip');

    const backToMtlxPath = await convertMaterialXFile(zipPath, 'mtlx');
    expect(existsSync(backToMtlxPath)).toBe(true);

    const tmpEntries = await readdir(tmpdir());
    expect(tmpEntries.some((entry) => entry.startsWith('mtlx-convert-'))).toBe(false);
  });
});

describe('safe conversion', () => {
  it('preserves an existing output and uses a numbered destination', async () => {
    cpSync(path.join(fixturesDir, 'copper'), dir, { recursive: true });
    const existing = path.join(dir, 'copper.mtlx.zip');
    await writeFile(existing, 'existing material');
    const output = await convertMaterialXFile(path.join(dir, 'copper.mtlx'), 'mtlx.zip');
    expect(output).toBe(path.join(dir, 'copper-2.mtlx.zip'));
    expect(await readFile(existing, 'utf8')).toBe('existing material');
  });

  it('summarizes mixed selections and continues after failures', async () => {
    cpSync(path.join(fixturesDir, 'copper'), dir, { recursive: true });
    const result = await convertMaterialXFiles(
      [path.join(dir, 'already.mtlx.zip'), path.join(dir, 'missing.mtlx'), path.join(dir, 'copper.mtlx')],
      'mtlx.zip',
    );
    expect(result.skipped).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(result.converted).toEqual([path.join(dir, 'copper.mtlx.zip')]);
  });
});
