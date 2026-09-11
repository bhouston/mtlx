import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Zip, ZipDeflate, zipSync } from 'fflate';
import { checkMaterialXZipArchive, createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
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

describe('archive resource budgets', () => {
  const compressed = () =>
    zipSync({
      'test.mtlx': new TextEncoder().encode(SAMPLE_MTLX),
      'texture.bin': new Uint8Array(64 * 1024),
      'second.bin': new Uint8Array(64 * 1024),
    });

  it.each([
    ['maxArchiveBytes', 10],
    ['maxXmlBytes', 10],
    ['maxArchiveEntries', 2],
    ['maxEntryBytes', 32 * 1024],
    ['maxExpandedBytes', 100 * 1024],
  ])('rejects %s without returning partial entries', (limit, value) => {
    const result = inspectMaterialXZipArchive(compressed(), { [limit]: value });
    expect(result.entries).toEqual([]);
    expect(result.issues[0].message).toContain(limit);
  });

  it('allows deliberate higher budgets and preserves decompressed bytes', () => {
    const result = inspectMaterialXZipArchive(compressed(), { maxExpandedBytes: 256 * 1024 });
    expect(result.issues).toEqual([]);
    expect(result.entries.find((entry) => entry.path === 'texture.bin')?.data).toEqual(new Uint8Array(64 * 1024));
  });

  it('rejects forged central-directory sizes while inflating', () => {
    const data = compressed();
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let offset = 0; offset + 46 <= data.length; offset++) {
      if (view.getUint32(offset, true) === 0x02014b50) view.setUint32(offset + 24, 1, true);
    }
    const result = inspectMaterialXZipArchive(data);
    expect(result.entries).toEqual([]);
    expect(result.issues[0].message).toContain('size differs');
  });

  it('rejects a declared multi-gigabyte entry before allocating its output', () => {
    const data = compressed();
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let offset = 0; offset + 46 <= data.length; offset++) {
      if (view.getUint32(offset, true) === 0x02014b50) {
        view.setUint32(offset + 24, 0x80000000, true);
        break;
      }
    }
    const result = inspectMaterialXZipArchive(data);
    expect(result.entries).toEqual([]);
    expect(result.issues[0].message).toContain('maxEntryBytes');
  });

  it('rejects invalid short archives without entering the ZIP scanner', () => {
    expect(inspectMaterialXZipArchive(new Uint8Array()).issues[0].message).toContain('Truncated');
  });

  it('rejects duplicate archive paths on write', () => {
    expect(() =>
      createMaterialXZipArchive([
        { path: 'a.mtlx', data: new Uint8Array() },
        { path: 'a.mtlx', data: new Uint8Array() },
      ]),
    ).toThrow('Duplicate archive path');
  });

  it('rejects duplicate paths on read and accepts streaming ZIP data descriptors', () => {
    const buildStreaming = (names: string[]) => {
      const chunks: Uint8Array[] = [];
      const zip = new Zip((error, chunk) => {
        if (error) throw error;
        chunks.push(chunk);
      });
      for (const name of names) {
        const file = new ZipDeflate(name);
        zip.add(file);
        file.push(new TextEncoder().encode(SAMPLE_MTLX), true);
      }
      zip.end();
      const data = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }
      return data;
    };
    expect(inspectMaterialXZipArchive(buildStreaming(['test.mtlx'])).issues).toEqual([]);
    expect(inspectMaterialXZipArchive(buildStreaming(['test.mtlx', 'test.mtlx'])).issues[0].message).toContain(
      'Duplicate archive path',
    );
  });

  it('applies caller XML budgets to root-document validation', () => {
    const issues = checkMaterialXZipArchive(compressed(), { maxXmlElements: 1 });
    expect(issues.some((issue) => issue.message.includes('maxXmlElements'))).toBe(true);
  });
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
