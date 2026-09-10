import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { checkMaterialXZipPackage, inspectMaterialXZipArchive, unpackMaterialXZip } from './mtlxzip.js';

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
  });

  it('flags an archive with no .mtlx file', () => {
    const zipped = zipSync({ 'readme.txt': new TextEncoder().encode('hi') });
    const archive = inspectMaterialXZipArchive(zipped);
    expect(archive.issues).toContainEqual(expect.objectContaining({ level: 'error' }));
  });

  it('checks and unpacks a .mtlx.zip file on disk', async () => {
    const zipped = zipSync({ 'test.mtlx': new TextEncoder().encode(SAMPLE_MTLX) });
    const inputPath = path.join(dir, 'test.mtlx.zip');
    await writeFile(inputPath, zipped);

    const check = await checkMaterialXZipPackage(inputPath);
    expect(check.format).toBe('mtlx.zip');
    expect(check.issues.filter((issue) => issue.level === 'error')).toHaveLength(0);

    const unpacked = await unpackMaterialXZip(inputPath, { outputDir: path.join(dir, 'out') });
    expect(unpacked.entries).toEqual(['test.mtlx']);
  });
});
