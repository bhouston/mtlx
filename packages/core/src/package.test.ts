import { describe, expect, it } from 'vitest';
import {
  mergeMaterialXPackages,
  relocateTextureResources,
  resolveMaterialXResources,
  type MaterialXPackage,
} from './package.js';
import { parseMaterialX, serializeMaterialX } from './xml.js';

const nodegraphWithTexture = (nodeName: string) => `<materialx version="1.39">
  <nodegraph name="${nodeName}">
    <image name="albedo" type="color3">
      <input name="file" type="filename" value="textures/albedo.png" />
    </image>
  </nodegraph>
</materialx>`;

const makePackage = (name: string, xml: string, resources: MaterialXPackage['resources'] = []): MaterialXPackage => ({
  rootPath: `${name}.mtlx`,
  document: parseMaterialX(xml),
  resources,
});

describe('resolveMaterialXResources', () => {
  it("allows a relative reference that escapes the document's own directory", async () => {
    const document = parseMaterialX(nodegraphWithTexture('NG'));
    document.elements[0]!.children[0]!.children[0]!.attributes.value = '../../shared/textures/albedo.png';
    const resources = await resolveMaterialXResources(document, async (rel) => {
      expect(rel).toBe('../../shared/textures/albedo.png');
      return new Uint8Array([1, 2, 3]);
    });
    expect(resources).toHaveLength(1);
    expect(resources[0]!.sourcePath).toBe('../../shared/textures/albedo.png');
    // The archive path stays contained under textures/ regardless of where the source came from.
    expect(resources[0]!.archivePath).toBe('textures/albedo.png');
  });
});

describe('mergeMaterialXPackages', () => {
  it('preserves chained resource identities without mutating either input', () => {
    const resource = (archivePath: string, value: number) => ({
      archivePath,
      sourcePath: archivePath,
      data: new Uint8Array([value]),
    });
    const a = makePackage('a', nodegraphWithTexture('A'), [resource('textures/albedo.png', 1)]);
    const b = makePackage(
      'b',
      '<materialx><image name="B"><input name="file" type="filename" value="textures/albedo.png"/><input name="other" type="filename" value="textures/albedo-2.png"/></image></materialx>',
      [resource('textures/albedo.png', 2), resource('textures/albedo-2.png', 3)],
    );
    const before = serializeMaterialX(b.document);
    const merged = mergeMaterialXPackages([a, b]);
    expect(merged.document.nodes[0]?.inputs.map((input) => input.value)).toEqual([
      'textures/albedo-3.png',
      'textures/albedo-2.png',
    ]);
    expect(serializeMaterialX(b.document)).toBe(before);
    expect(merged.resources.map((r) => [r.archivePath, r.data[0]])).toEqual([
      ['textures/albedo.png', 1],
      ['textures/albedo-3.png', 2],
      ['textures/albedo-2.png', 3],
    ]);
  });

  it('returns a single input package as-is', () => {
    const pkg = makePackage(
      'a',
      '<materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>',
    );
    expect(mergeMaterialXPackages([pkg])).toBe(pkg);
  });

  it('concatenates top-level elements from every input', () => {
    const a = makePackage('a', '<materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>');
    const b = makePackage('b', '<materialx version="1.39"><surfacematerial name="M_b" type="material" /></materialx>');

    const merged = mergeMaterialXPackages([a, b]);

    expect(merged.document.elements.map((element) => element.attributes.name)).toEqual(['M_a', 'M_b']);
    expect(serializeMaterialX(merged.document)).toContain('M_a');
    expect(serializeMaterialX(merged.document)).toContain('M_b');
  });

  it('throws when two inputs share a top-level name', () => {
    const a = makePackage('a', '<materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>');
    const b = makePackage('b', '<materialx version="1.39"><surfacematerial name="M_a" type="material" /></materialx>');

    expect(() => mergeMaterialXPackages([a, b])).toThrow(/duplicate top-level name "M_a"/);
  });

  it('renames a colliding resource archive path and rewrites the reference to it', () => {
    const data = new Uint8Array([1, 2, 3]);
    const a = makePackage('a', nodegraphWithTexture('NG_a'), [
      { archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data },
    ]);
    const b = makePackage('b', nodegraphWithTexture('NG_b'), [
      { archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data },
    ]);

    const merged = mergeMaterialXPackages([a, b]);

    expect(merged.resources.map((resource) => resource.archivePath)).toEqual([
      'textures/albedo.png',
      'textures/albedo-2.png',
    ]);
    expect(serializeMaterialX(merged.document)).toContain('textures/albedo-2.png');
  });
});

describe('relocateTextureResources', () => {
  it('moves image resources into the given directory and rewrites references', () => {
    const data = new Uint8Array([1, 2, 3]);
    const pkg = makePackage('a', nodegraphWithTexture('NG_a'), [
      { archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data },
    ]);

    relocateTextureResources(pkg, 'assets/shared');

    expect(pkg.resources[0]!.archivePath).toBe('assets/shared/albedo.png');
    expect(serializeMaterialX(pkg.document)).toContain('assets/shared/albedo.png');
    expect(serializeMaterialX(pkg.document)).not.toContain('textures/albedo.png');
  });

  it('leaves non-image resources alone', () => {
    const data = new Uint8Array([1, 2, 3]);
    const pkg = makePackage('a', nodegraphWithTexture('NG_a'), [
      { archivePath: 'libraries/shared.mtlx', sourcePath: 'shared.mtlx', data },
    ]);

    relocateTextureResources(pkg, 'assets/shared');

    expect(pkg.resources[0]!.archivePath).toBe('libraries/shared.mtlx');
  });

  it('accepts a parent-relative directory', () => {
    const data = new Uint8Array([1, 2, 3]);
    const pkg = makePackage('a', nodegraphWithTexture('NG_a'), [
      { archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data },
    ]);

    relocateTextureResources(pkg, '../shared-textures');

    expect(pkg.resources[0]!.archivePath).toBe('../shared-textures/albedo.png');
    expect(serializeMaterialX(pkg.document)).toContain('../shared-textures/albedo.png');
  });

  it('accepts an absolute directory', () => {
    const data = new Uint8Array([1, 2, 3]);
    const pkg = makePackage('a', nodegraphWithTexture('NG_a'), [
      { archivePath: 'textures/albedo.png', sourcePath: 'albedo.png', data },
    ]);

    relocateTextureResources(pkg, '/data/shared-textures');

    expect(pkg.resources[0]!.archivePath).toBe('/data/shared-textures/albedo.png');
    expect(serializeMaterialX(pkg.document)).toContain('/data/shared-textures/albedo.png');
  });
});
