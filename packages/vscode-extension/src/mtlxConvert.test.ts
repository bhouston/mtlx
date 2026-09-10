import { cpSync, existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { convertMaterialXFile, outputPathFor } from './mtlxConvert.js';

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
    expect(outputPathFor('/a/b/material.mtlx', 'mtlz')).toBe('/a/b/material.mtlz');
    expect(outputPathFor('/a/b/material.mtlx', 'mtlx.zip')).toBe('/a/b/material.mtlx.zip');
    expect(outputPathFor('/a/b/material.mtlz', 'mtlx')).toBe('/a/b/material.mtlx');
    expect(outputPathFor('/a/b/material.mtlx.zip', 'mtlx')).toBe('/a/b/material.mtlx');
  });
});

describe('convertMaterialXFile', () => {
  it('rejects converting a file to its own format', async () => {
    await expect(convertMaterialXFile('/a/b/material.mtlx', 'mtlx')).rejects.toThrow(/already mtlx/);
  });

  it('mtlx -> mtlz -> mtlx round-trips the procedural copper fixture', async () => {
    cpSync(path.join(fixturesDir, 'copper'), dir, { recursive: true });
    const materialPath = path.join(dir, 'copper.mtlx');

    const mtlzPath = await convertMaterialXFile(materialPath, 'mtlz');
    expect(mtlzPath).toBe(path.join(dir, 'copper.mtlz'));
    expect(existsSync(mtlzPath)).toBe(true);

    const backToMtlxPath = await convertMaterialXFile(mtlzPath, 'mtlx');
    expect(existsSync(backToMtlxPath)).toBe(true);
  });

  it('mtlx -> mtlx.zip carries along referenced textures (wood_grain fixture)', async () => {
    cpSync(path.join(fixturesDir, 'wood_grain'), dir, { recursive: true });
    const materialPath = path.join(dir, 'wood_grain.mtlx');

    const zipPath = await convertMaterialXFile(materialPath, 'mtlx.zip');
    expect(zipPath).toBe(path.join(dir, 'wood_grain.mtlx.zip'));
    expect(existsSync(zipPath)).toBe(true);
  });

  it('mtlz -> mtlx.zip converts without leaving a temp dir behind', async () => {
    cpSync(path.join(fixturesDir, 'wood_grain'), dir, { recursive: true });
    const mtlzPath = await convertMaterialXFile(path.join(dir, 'wood_grain.mtlx'), 'mtlz');

    const zipPath = await convertMaterialXFile(mtlzPath, 'mtlx.zip');
    expect(zipPath).toBe(path.join(dir, 'wood_grain.mtlx.zip'));
    expect(existsSync(zipPath)).toBe(true);

    const tmpEntries = await readdir(tmpdir());
    expect(tmpEntries.some((entry) => entry.startsWith('mtlx-convert-'))).toBe(false);
  });
});
