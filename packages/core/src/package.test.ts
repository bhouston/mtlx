import { describe, expect, it } from 'vitest';
import { mergeMaterialXPackages, type MaterialXPackage } from './package.js';
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

describe('mergeMaterialXPackages', () => {
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
