import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { extractMaterialXText } from './materialx-zip.js';
import { PRESET_MATERIALS, presetFileName, presetFolderUrl, presetId, resolveMaterialParam } from './presets.js';

describe('presets', () => {
  it('has no duplicate material names across categories', () => {
    const names = PRESET_MATERIALS.map((preset) => preset.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('builds the expected raw GitHub URL', () => {
    const preset = PRESET_MATERIALS[0]!;
    expect(presetFolderUrl(preset)).toBe(
      `https://raw.githubusercontent.com/bhouston/material-samples/main/materials/showcase/${preset.category}/${preset.name}/`,
    );
    expect(presetFileName(preset)).toBe(`${preset.name}.mtlx`);
  });

  it('resolves a preset id from the material query param', () => {
    const preset = PRESET_MATERIALS[0]!;
    expect(resolveMaterialParam(presetId(preset))).toEqual({
      folderUrl: presetFolderUrl(preset),
      fileName: presetFileName(preset),
    });
  });

  it('resolves an externally-hosted .mtlx URL from the material query param', () => {
    expect(resolveMaterialParam('https://example.com/materials/foo.mtlx')).toEqual({
      folderUrl: 'https://example.com/materials/',
      fileName: 'foo.mtlx',
    });
  });

  it('returns undefined for an unknown, non-URL material param', () => {
    expect(resolveMaterialParam('not-a-preset')).toBeUndefined();
  });
});

describe('extractMaterialXText', () => {
  it('finds a root-level .mtlx entry inside a zip', () => {
    const zipped = zipSync({
      'material.mtlx': new TextEncoder().encode('<materialx version="1.39" />'),
      'textures/albedo.png': new Uint8Array([1, 2, 3]),
    });

    expect(extractMaterialXText(zipped.buffer as ArrayBuffer)).toContain('materialx');
  });

  it('throws when there is no .mtlx entry', () => {
    const zipped = zipSync({ 'readme.txt': new TextEncoder().encode('hi') });
    expect(() => extractMaterialXText(zipped.buffer as ArrayBuffer)).toThrow(/does not contain a \.mtlx/);
  });
});
