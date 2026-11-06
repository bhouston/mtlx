import { expect, it } from 'vitest';
import { DEFAULT_VIEWER_SETTINGS } from 'mtlx-viewer/settings';
import { readFileSync } from 'node:fs';
import { normalizePreviewState } from './preview/state.js';
import { parsePreviewSettings, PREVIEW_NAME_PATTERN } from './previewSettings.js';
it('defaults to neutral studio, totem and rotation', () => {
  expect(parsePreviewSettings({})).toMatchObject({
    defaultIbl: 'studio',
    defaultGeometry: 'totem',
    autoRotate: true,
    bloom: true,
    ao: true,
    toneMapping: 'neutral',
    background: 'white',
    warnings: [],
  });
});
it('accepts custom defaults and case-sensitive stub identifiers', () => {
  const result = parsePreviewSettings({
    ibls: [{ name: '_My_IBL2', source: '/ibl.hdr' }],
    geometries: [{ name: 'bust', source: 'https://example.com/bust.gltf' }],
    defaultIbl: '_My_IBL2',
    defaultGeometry: 'bust',
    autoRotate: false,
  });
  expect(result).toMatchObject({ defaultIbl: '_My_IBL2', defaultGeometry: 'bust', autoRotate: false, warnings: [] });
  expect(new RegExp(PREVIEW_NAME_PATTERN).test('_')).toBe(true);
});
it('rejects malformed names, collisions and unknown defaults without losing valid assets', () => {
  const result = parsePreviewSettings({
    ibls: [
      { name: 'bridge', source: 'a.hdr' },
      { name: '9bad', source: 'a.hdr' },
      { name: 'with space', source: 'a.hdr' },
      { name: 'good', source: 'a.hdr' },
      { name: 'good', source: 'b.hdr' },
    ],
    geometries: [{ name: 'plane', source: 'a.glb' }],
    defaultIbl: 'missing',
    defaultGeometry: 'bad name',
    autoRotate: 'false',
  });
  expect(result.ibls).toEqual([{ name: 'good', source: 'a.hdr' }]);
  expect(result.geometries).toEqual([]);
  expect(result).toMatchObject({ defaultIbl: 'studio', defaultGeometry: 'totem', autoRotate: true });
  expect(result.warnings).toHaveLength(8);
});

it('validates effect defaults and tone mapping names', () => {
  expect(parsePreviewSettings({ background: 'none' })).toMatchObject({ background: 'none', warnings: [] });
  expect(parsePreviewSettings({ background: 'blue' })).toMatchObject({ background: 'white' });
  expect(parsePreviewSettings({ bloom: false, ao: false, toneMapping: 'agx' })).toMatchObject({
    bloom: false,
    ao: false,
    toneMapping: 'agx',
    warnings: [],
  });
  const invalid = parsePreviewSettings({ bloom: 'false', ao: 0, toneMapping: 'neural' });
  expect(invalid).toMatchObject({ bloom: true, ao: true, toneMapping: 'neutral' });
  expect(invalid.warnings).toHaveLength(3);
});

it('normalizes configured environment rotation and rejects invalid values', () => {
  expect(parsePreviewSettings({ environmentRotation: -90 })).toMatchObject({ environmentRotation: 270, warnings: [] });
  expect(parsePreviewSettings({ environmentRotation: Infinity })).toMatchObject({
    environmentRotation: 0,
    warnings: ['environmentRotation must be finite degrees; using 0.'],
  });
});

it('keeps new preview lighting and contributed VS Code defaults aligned with the viewer', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const properties = manifest.contributes.configuration.properties;
  const settings = parsePreviewSettings({});
  const state = normalizePreviewState({}, settings);
  expect(properties['mtlx.preview.defaultIbl'].default).toBe(DEFAULT_VIEWER_SETTINGS.ibl);
  expect(properties['mtlx.preview.background'].default).toBe(DEFAULT_VIEWER_SETTINGS.background);
  expect(state.settings).toMatchObject({
    ibl: DEFAULT_VIEWER_SETTINGS.ibl,
    background: DEFAULT_VIEWER_SETTINGS.background,
  });
  expect(parsePreviewSettings({ defaultIbl: 'missing', background: 'invalid' })).toMatchObject({
    defaultIbl: DEFAULT_VIEWER_SETTINGS.ibl,
    background: DEFAULT_VIEWER_SETTINGS.background,
  });
});
