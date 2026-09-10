import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { checkMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import { checkMaterialX, loadMaterialXPackage, writeMaterialXPackage } from './node.js';

const SAMPLE_MTLX = `<?xml version="1.0"?>
<materialx version="1.39">
  <standard_surface name="SR_test" type="surfaceshader" />
</materialx>
`;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlxzip-test-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('.mtlx.zip (relaxed reader)', () => {
  it('reads an ordinary DEFLATE-compressed zip with a root .mtlx entry', () => {
    const zipped = zipSync(
      { 'test.mtlx': new TextEncoder().encode(SAMPLE_MTLX), 'textures/albedo.png': new Uint8Array([1, 2, 3]) },
      { level: 6 },
    );

    const archive = inspectMaterialXZipArchive(zipped);
    expect(archive.issues).toHaveLength(0);
    expect(archive.rootEntry?.path).toBe('test.mtlx');
    expect(archive.entries.map((entry) => entry.path).toSorted()).toEqual(['test.mtlx', 'textures/albedo.png']);
    expect(checkMaterialXZipArchive(zipped).filter((issue) => issue.level === 'error')).toHaveLength(0);
  });

  it('flags an archive with no .mtlx file', () => {
    const zipped = zipSync({ 'readme.txt': new TextEncoder().encode('hi') });
    expect(checkMaterialXZipArchive(zipped)).toContainEqual(expect.objectContaining({ level: 'error' }));
  });

  it('checks and unpacks a .mtlx.zip file on disk', async () => {
    const zipped = zipSync({ 'test.mtlx': new TextEncoder().encode(SAMPLE_MTLX) });
    const inputPath = path.join(dir, 'test.mtlx.zip');
    await writeFile(inputPath, zipped);

    const check = await checkMaterialX(inputPath);
    expect(check.format).toBe('mtlx.zip');
    expect(check.issues.filter((issue) => issue.level === 'error')).toHaveLength(0);

    const unpacked = await writeMaterialXPackage(
      await loadMaterialXPackage(inputPath),
      path.join(dir, 'out/test.mtlx'),
    );
    expect(unpacked.entries).toEqual(['test.mtlx']);
  });

  it('writeMaterialXPackage writes a .mtlx.zip when the output path says so', async () => {
    await writeFile(path.join(dir, 'material.mtlx'), SAMPLE_MTLX);

    const outputPath = path.join(dir, 'material.mtlx.zip');
    const packed = await writeMaterialXPackage(await loadMaterialXPackage(path.join(dir, 'material.mtlx')), outputPath);
    expect(packed.format).toBe('mtlx.zip');
    expect(packed.entries).toEqual(['material.mtlx']);

    const check = await checkMaterialX(outputPath);
    expect(check.issues.filter((issue) => issue.level === 'error')).toHaveLength(0);
  });
});
