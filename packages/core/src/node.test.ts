import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeMaterialXPackage } from './node.js';
import { parseMaterialX } from './xml.js';
import type { MaterialXPackage } from './package.js';

const XML = `<materialx version="1.39">
  <nodegraph name="NG">
    <image name="albedo" type="color3">
      <input name="file" type="filename" value="textures/albedo.png" />
    </image>
  </nodegraph>
</materialx>`;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlx-node-test-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const makePackage = (data: Uint8Array): MaterialXPackage => ({
  rootPath: 'material.mtlx',
  document: parseMaterialX(XML),
  resources: [{ archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data }],
});

describe('writeMaterialXPackage texture dedup', () => {
  it('reuses an existing file whose content matches exactly', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await mkdir(path.join(dir, 'textures'), { recursive: true });
    await writeFile(path.join(dir, 'textures', 'albedo.png'), bytes);

    const result = await writeMaterialXPackage(makePackage(bytes), path.join(dir, 'material.mtlx'));

    expect(result.entries).toContain('textures/albedo.png');
    const files = await readdir(path.join(dir, 'textures'));
    expect(files).toEqual(['albedo.png']); // no -2 created
    const doc = await readFile(path.join(dir, 'material.mtlx'), 'utf8');
    expect(doc).toContain('textures/albedo.png');
  });

  it('renames to avoid overwriting an existing file with different content', async () => {
    await mkdir(path.join(dir, 'textures'), { recursive: true });
    const original = new Uint8Array([9, 9, 9, 9]);
    await writeFile(path.join(dir, 'textures', 'albedo.png'), original);

    const incoming = new Uint8Array([1, 2, 3, 4]); // same size, different bytes
    const result = await writeMaterialXPackage(makePackage(incoming), path.join(dir, 'material.mtlx'));

    expect(result.entries).toContain('textures/albedo-2.png');
    // original file untouched
    expect(await readFile(path.join(dir, 'textures', 'albedo.png'))).toEqual(Buffer.from(original));
    expect(await readFile(path.join(dir, 'textures', 'albedo-2.png'))).toEqual(Buffer.from(incoming));
    const doc = await readFile(path.join(dir, 'material.mtlx'), 'utf8');
    expect(doc).toContain('textures/albedo-2.png');
  });
});
