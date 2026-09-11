import { expect, it } from 'vitest';
import { parsePreviewSettings, PREVIEW_NAME_PATTERN } from './previewSettings.js';
it('defaults to bridge, totem and rotation', () => {
  expect(parsePreviewSettings({})).toMatchObject({
    defaultIbl: 'bridge',
    defaultGeometry: 'totem',
    autoRotate: true,
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
  expect(result).toMatchObject({ defaultIbl: 'bridge', defaultGeometry: 'totem', autoRotate: true });
  expect(result.warnings).toHaveLength(8);
});
