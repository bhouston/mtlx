import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMaterialZArchive, inspectMaterialZArchive } from './mtlz.js';
import { checkMaterialX, loadMaterialXPackage, packMaterialX, unpackMaterialX, writeMaterialXPackage } from './node.js';
import { rewriteResourcePath, transform, type Transform } from './package.js';

const SAMPLE_MTLX = `<?xml version="1.0"?>
<materialx version="1.39">
  <standard_surface name="SR_test" type="surfaceshader">
    <input name="base_color" type="color3" value="1, 0, 0" />
  </standard_surface>
  <surfacematerial name="M_test" type="material">
    <input name="surfaceshader" type="surfaceshader" nodename="SR_test" />
  </surfacematerial>
</materialx>
`;

const SAMPLE_MTLX_WITH_TEXTURE = `<?xml version="1.0"?>
<materialx version="1.39">
  <nodegraph name="NG_test">
    <image name="albedo" type="color3">
      <input name="file" type="filename" value="./textures/../textures/albedo.png" />
    </image>
  </nodegraph>
</materialx>
`;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlz-test-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('createMaterialZArchive / inspectMaterialZArchive (pure)', () => {
  it('round-trips bytes with the root first and 64-byte aligned resources', () => {
    const bytes = createMaterialZArchive([
      { path: 'textures/a.bin', data: new Uint8Array([1, 2, 3]) },
      { path: 'root.mtlx', data: new TextEncoder().encode(SAMPLE_MTLX) },
    ]);
    const archive = inspectMaterialZArchive(bytes);
    expect(archive.issues).toEqual([]);
    expect(archive.rootEntry?.path).toBe('root.mtlx');
    expect(archive.entries.map((entry) => entry.path)).toEqual(['root.mtlx', 'textures/a.bin']);
    expect(archive.entries[1]!.dataOffset % 64).toBe(0);
    expect(Array.from(archive.entries[1]!.data)).toEqual([1, 2, 3]);
  });

  it('rejects a resource outside a subdirectory', () => {
    expect(() =>
      createMaterialZArchive([
        { path: 'root.mtlx', data: new Uint8Array() },
        { path: 'loose.png', data: new Uint8Array() },
      ]),
    ).toThrow(/subdirectories/);
  });
});

describe('pack / unpack .mtlz', () => {
  it('round-trips a .mtlx file through pack -> unpack', async () => {
    const inputPath = path.join(dir, 'test.mtlx');
    await writeFile(inputPath, SAMPLE_MTLX);

    const packed = await packMaterialX(inputPath);
    expect(packed.outputPath).toBe(path.join(dir, 'test.mtlz'));
    expect(packed.entries).toEqual(['test.mtlx']);

    const unpacked = await unpackMaterialX(packed.outputPath, { outputDir: path.join(dir, 'out') });
    expect(unpacked.entries).toEqual(['test.mtlx']);
    expect(unpacked.rootPath).toBe(path.join(dir, 'out', 'test.mtlx'));

    const check = await checkMaterialX(packed.outputPath);
    expect(check.format).toBe('mtlz');
    expect(check.issues.filter((issue) => issue.level === 'error')).toHaveLength(0);
  });

  it('reports an error for a .mtlx file that fails to parse', async () => {
    const inputPath = path.join(dir, 'broken.mtlx');
    await writeFile(inputPath, '<materialx><unclosed></materialx>');

    const check = await checkMaterialX(inputPath);
    expect(check.issues).toContainEqual(expect.objectContaining({ level: 'error' }));
  });

  it('reports a missing file as an error issue instead of throwing', async () => {
    const check = await checkMaterialX(path.join(dir, 'nope.mtlz'));
    expect(check.issues).toContainEqual(expect.objectContaining({ level: 'error' }));
  });
});

describe('loadMaterialXPackage / transform / writeMaterialXPackage', () => {
  it('normalizes references, runs transforms in order, and rewrites renamed resources', async () => {
    await mkdir(path.join(dir, 'textures'), { recursive: true });
    const inputPath = path.join(dir, 'material.mtlx');
    await writeFile(inputPath, SAMPLE_MTLX_WITH_TEXTURE);
    await writeFile(path.join(dir, 'textures/albedo.png'), new Uint8Array([137, 80, 78, 71]));

    const pkg = await loadMaterialXPackage(inputPath);
    expect(pkg.resources.map((resource) => resource.archivePath)).toEqual(['textures/albedo.png']);

    const order: string[] = [];
    const first: Transform = () => {
      order.push('first');
    };
    const toWebp: Transform = async (target) => {
      order.push('second');
      const [texture] = target.resources;
      texture!.data = new Uint8Array([...texture!.data, 0xff]);
      expect(rewriteResourcePath(target.document, texture!.archivePath, 'textures/albedo.webp')).toBe(1);
      texture!.archivePath = 'textures/albedo.webp';
    };
    await transform(pkg, first, toWebp);
    expect(order).toEqual(['first', 'second']);

    const written = await writeMaterialXPackage(pkg, path.join(dir, 'out.mtlz'));
    expect(written.entries).toEqual(['material.mtlx', 'textures/albedo.webp']);

    const archive = inspectMaterialZArchive(await readFile(written.outputPath));
    const rootText = new TextDecoder().decode(archive.rootEntry!.data);
    expect(rootText).toContain('textures/albedo.webp');
    expect(rootText).not.toContain('albedo.png');
    expect(Array.from(archive.entries[1]!.data)).toEqual([137, 80, 78, 71, 0xff]);
  });

  it('refuses references that escape the root directory', async () => {
    const inputPath = path.join(dir, 'escape.mtlx');
    await writeFile(inputPath, SAMPLE_MTLX_WITH_TEXTURE.replace('./textures/../textures/albedo.png', '../secret.png'));
    await expect(loadMaterialXPackage(inputPath)).rejects.toThrow(/outside/);
  });
});
