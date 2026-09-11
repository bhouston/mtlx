import { expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadMaterialXPackage, writeMaterialXPackage } from './node.js';
import { createMaterialXZipArchive } from './mtlxzip.js';
import { buildResourceGraph } from './resource-graph.js';

it('rebases a nested archive root when writing a loose document', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mtlx-nested-'));
  try {
    const input = path.join(dir, 'input.mtlx.zip');
    await writeFile(
      input,
      createMaterialXZipArchive([
        {
          path: 'nested/m.mtlx',
          data: new TextEncoder().encode(
            '<materialx><image name="i"><input name="file" type="filename" value="textures/a.png"/></image></materialx>',
          ),
        },
        { path: 'nested/textures/a.png', data: new Uint8Array([1]) },
      ]),
    );
    const pkg = await loadMaterialXPackage(input);
    const out = path.join(dir, 'out', 'renamed.mtlx');
    await writeMaterialXPackage(pkg, out);
    expect(await readFile(out, 'utf8')).toContain('nested/textures/a.png');
    await rm(input);
    expect(buildResourceGraph(await loadMaterialXPackage(out)).edges.every((edge) => edge.resourceId)).toBe(true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('keeps libraries and textures usable after removal of the original source tree', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mtlx-dependencies-'));
  try {
    const source = path.join(dir, 'source');
    await mkdir(path.join(source, 'lib'), { recursive: true });
    await writeFile(path.join(source, 'main.mtlx'), '<materialx><xi:include href="lib/shared.mtlx"/></materialx>');
    await writeFile(
      path.join(source, 'lib', 'shared.mtlx'),
      '<materialx><image name="i"><input name="file" type="filename" value="../a.png"/></image></materialx>',
    );
    await writeFile(path.join(source, 'a.png'), new Uint8Array([4, 5]));
    const zip = path.join(dir, 'packed.mtlx.zip');
    await writeMaterialXPackage(await loadMaterialXPackage(path.join(source, 'main.mtlx')), zip);
    await rm(source, { recursive: true });
    const out = path.join(dir, 'output', 'm.mtlx');
    await writeMaterialXPackage(await loadMaterialXPackage(zip), out);
    const result = await loadMaterialXPackage(out);
    expect(result.resources).toHaveLength(2);
    expect(buildResourceGraph(result).edges.every((edge) => edge.resourceId)).toBe(true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('materializes inherited file prefixes and roundtrips an absolute texture-library destination', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mtlx-prefix-'));
  try {
    await mkdir(path.join(dir, 'textures'));
    await mkdir(path.join(dir, 'other'));
    await writeFile(path.join(dir, 'textures', 'a.png'), new Uint8Array([1]));
    await writeFile(path.join(dir, 'other', 'a.png'), new Uint8Array([2]));
    const input = path.join(dir, 'm.mtlx');
    await writeFile(
      input,
      '<materialx fileprefix="textures/"><image name="a"><input name="file" type="filename" value="a.png"/></image><image name="b" fileprefix="other/"><input name="file" type="filename" value="a.png"/></image></materialx>',
    );
    const pkg = await loadMaterialXPackage(input);
    expect(pkg.resources.map((r) => r.data[0]).toSorted()).toEqual([1, 2]);
    expect(pkg.document.attributes.fileprefix).toBeUndefined();
    const output = path.join(dir, 'output', 'm.mtlx');
    await writeMaterialXPackage(pkg, output, { textureLibrary: path.join(dir, 'shared') });
    expect(await readFile(output, 'utf8')).toContain('../shared/');
    const reloaded = await loadMaterialXPackage(output);
    expect(reloaded.resources.map((r) => r.data[0]).toSorted()).toEqual([1, 2]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('applies caller XML budgets to included documents too', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mtlx-budget-'));
  try {
    await writeFile(path.join(dir, 'm.mtlx'), '<materialx><xi:include href="lib.mtlx"/></materialx>');
    await writeFile(path.join(dir, 'lib.mtlx'), '<materialx><look name="a"/><look name="b"/></materialx>');
    await expect(loadMaterialXPackage(path.join(dir, 'm.mtlx'), { limits: { maxXmlElements: 2 } })).rejects.toThrow(
      /maxXmlElements/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
