import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkMaterialXPackage, packMaterialX, readMaterialZArchive, unpackMaterialZ } from './mtlz.js';

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
      <input name="file" type="filename" value="textures/albedo.png" />
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

describe('pack / unpack .mtlz', () => {
  it('round-trips a .mtlx file through pack -> unpack', async () => {
    const inputPath = path.join(dir, 'test.mtlx');
    await writeFile(inputPath, SAMPLE_MTLX);

    const packed = await packMaterialX(inputPath);
    expect(packed.outputPath).toBe(path.join(dir, 'test.mtlz'));
    expect(packed.entries).toEqual(['test.mtlx']);

    const unpacked = await unpackMaterialZ(packed.outputPath, { outputDir: path.join(dir, 'out') });
    expect(unpacked.entries).toEqual(['test.mtlx']);

    const check = await checkMaterialXPackage(packed.outputPath);
    expect(check.format).toBe('mtlz');
    expect(check.issues.filter((issue) => issue.level === 'error')).toHaveLength(0);
  });

  it('reports an error for a .mtlx file that fails to parse', async () => {
    const inputPath = path.join(dir, 'broken.mtlx');
    await writeFile(inputPath, '<materialx><unclosed></materialx>');

    const check = await checkMaterialXPackage(inputPath);
    expect(check.issues).toContainEqual(expect.objectContaining({ level: 'error' }));
  });

  it('applies a transformResource hook to referenced textures and rewrites their extension', async () => {
    await mkdir(path.join(dir, 'textures'), { recursive: true });
    const inputPath = path.join(dir, 'material.mtlx');
    await writeFile(inputPath, SAMPLE_MTLX_WITH_TEXTURE);
    await writeFile(path.join(dir, 'textures/albedo.png'), new Uint8Array([137, 80, 78, 71]));

    const packed = await packMaterialX(inputPath, {
      transformResource: async (data) => ({ data: new Uint8Array([...data, 0xff]), extension: '.webp' }),
    });

    expect(packed.entries).toEqual(['material.mtlx', 'textures/albedo.webp']);

    const archive = await readMaterialZArchive(packed.outputPath);
    const rootText = new TextDecoder().decode(archive.rootEntry!.data);
    expect(rootText).toContain('textures/albedo.webp');
    expect(rootText).not.toContain('albedo.png');

    const textureEntry = archive.entries.find((entry) => entry.path === 'textures/albedo.webp');
    expect(Array.from(textureEntry?.data ?? [])).toEqual([137, 80, 78, 71, 0xff]);
  });
});
