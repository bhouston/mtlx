import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkMaterialXPackage, packMaterialX, unpackMaterialZ } from './mtlz.js';

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
});
