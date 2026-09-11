import { expect, it } from 'vitest';
import { parseMaterialX } from './xml.js';
import { validateMaterialXPackage } from './validate-package.js';
import { checkMaterialXZipArchive, createMaterialXZipArchive } from './mtlxzip.js';

it('reports missing archive textures by default', () => {
  const issues = checkMaterialXZipArchive(
    createMaterialXZipArchive([
      {
        path: 'nested/m.mtlx',
        data: new TextEncoder().encode(
          '<materialx><image name="a"><input name="file" type="filename" value="missing.png"/></image></materialx>',
        ),
      },
    ]),
  );
  expect(issues).toContainEqual(expect.objectContaining({ code: 'RESOURCE_MISSING', level: 'error' }));
});

it('resolves node references through included documents without guessing resource bases', () => {
  const pkg = {
    rootPath: 'nested/m.mtlx',
    document: parseMaterialX(
      '<materialx><xi:include href="../lib.mtlx"/><surfacematerial name="m"><input name="surfaceshader" nodename="s" type="surfaceshader"/></surfacematerial></materialx>',
    ),
    resources: [
      {
        archivePath: 'lib.mtlx',
        sourcePath: 'lib.mtlx',
        data: new Uint8Array(),
        document: parseMaterialX('<materialx><standard_surface name="s" type="surfaceshader"/></materialx>'),
      },
    ],
  };
  expect(validateMaterialXPackage(pkg, { rules: ['structure', 'resources'] })).toEqual([]);
});
