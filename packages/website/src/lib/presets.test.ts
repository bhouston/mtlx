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

it('unifies legacy sample links and URL links, preserving query strings containing slashes', async () => {
  const { materialSearch, presetUrl } = await import('./presets.js');
  expect(materialSearch({ material: presetId(PRESET_MATERIALS[0]!) })).toEqual({
    materialUrl: presetUrl(PRESET_MATERIALS[0]!),
  });
  const url = 'https://example.com/a.mtlx?token=a/b';
  expect(materialSearch({ materialUrl: url })).toEqual({ materialUrl: url });
  expect(resolveMaterialParam(url)).toEqual({ folderUrl: 'https://example.com/', fileName: 'a.mtlx?token=a/b' });
  expect(resolveMaterialParam('https://example.com/page.html')).toBeUndefined();
});

it('resolves locally hosted samples and makes their URLs portable across deployments', async () => {
  const { presetUrl, materialSearch } = await import('./presets.js');
  const compound = PRESET_MATERIALS.find((preset) => preset.name === 'compound')!;
  expect(presetUrl(compound)).toBe('/materials/compound/compound.mtlx');
  expect(presetUrl(compound, 'http://localhost:3123')).toBe('http://localhost:3123/materials/compound/compound.mtlx');
  expect(resolveMaterialParam(presetUrl(compound))).toEqual({
    folderUrl: '/materials/compound/',
    fileName: 'compound.mtlx',
  });
  expect(materialSearch({ material: 'local/compound' })).toEqual({ materialUrl: presetUrl(compound) });
  expect(resolveMaterialParam('//example.com/material.mtlx')).toBeUndefined();
});
