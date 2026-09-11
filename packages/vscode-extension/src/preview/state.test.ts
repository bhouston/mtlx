import { expect, it } from 'vitest';
import { normalizePreviewState, type PreviewState } from './state';
import { parsePreviewSettings } from '../previewSettings';

const settings = parsePreviewSettings({
  ibls: [{ name: 'gallery', source: 'gallery.hdr' }],
  geometries: [{ name: 'bust', source: 'bust.glb' }],
  defaultIbl: 'gallery',
  defaultGeometry: 'bust',
});
const camera = { position: [1, 2, 3], target: [0, 0, 0], zoom: 1, rotation: [0, 1, 0] };
it('preserves existing storage keys, custom assets, and camera on restoration', () => {
  const saved: PreviewState = {
    settingsKey: JSON.stringify(settings),
    environmentKind: 'gallery',
    geometry: 'bust',
    rotating: false,
    bloom: false,
    ao: false,
    toneMapping: 'agx',
    environmentIntensity: 0.6,
    exposure: -1,
    material: 'Copper',
    camera,
  };
  expect(normalizePreviewState(saved, settings)).toEqual(saved);
});
it('applies changed host defaults and clears the old camera while retaining lighting and material choice', () => {
  const state = normalizePreviewState(
    { settingsKey: 'old', geometry: 'sphere', exposure: 1, environmentIntensity: 0.8, material: 'Copper', camera },
    settings,
  );
  expect(state.geometry).toBe('bust');
  expect(state.environmentKind).toBe('gallery');
  expect(state.camera).toBeUndefined();
  expect(state.exposure).toBe(1);
  expect(state.environmentIntensity).toBe(0.8);
  expect(state.material).toBe('Copper');
});
it('validates stale storage without losing supported custom asset names', () => {
  const state = normalizePreviewState(
    {
      settingsKey: JSON.stringify(settings),
      geometry: 'removed',
      environmentKind: 'removed',
      exposure: Infinity,
      environmentIntensity: 100,
      camera: { ...camera, target: [NaN, 0, 0] },
    },
    settings,
  );
  expect(state.geometry).toBe('bust');
  expect(state.environmentKind).toBe('gallery');
  expect(state.exposure).toBe(0);
  expect(state.environmentIntensity).toBe(2);
  expect(state.camera).toBeUndefined();
});
