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
it('preserves saved settings, custom assets, and camera on restoration', () => {
  const saved: PreviewState = {
    settingsKey: JSON.stringify(settings),
    settings: {
      ibl: 'gallery',
      geometry: 'bust',
      rotate: false,
      bloom: false,
      ao: false,
      toneMapping: 'agx',
      intensity: 0.6,
      exposure: -1,
      materialName: 'Copper',
    },
    camera,
  };
  expect(normalizePreviewState(saved, settings)).toEqual(saved);
});
it('applies changed host defaults and clears the old camera while retaining lighting and material choice', () => {
  const state = normalizePreviewState(
    {
      settingsKey: 'old',
      settings: { geometry: 'sphere', exposure: 1, intensity: 0.8, materialName: 'Copper' },
      camera,
    },
    settings,
  );
  expect(state.settings.geometry).toBe('bust');
  expect(state.settings.ibl).toBe('gallery');
  expect(state.camera).toBeUndefined();
  expect(state.settings.exposure).toBe(1);
  expect(state.settings.intensity).toBe(0.8);
  expect(state.settings.materialName).toBe('Copper');
});
it('validates stale storage without losing supported custom asset names', () => {
  const state = normalizePreviewState(
    {
      settingsKey: JSON.stringify(settings),
      settings: { geometry: 'removed', ibl: 'removed', exposure: Infinity, intensity: 100 },
      camera: { ...camera, target: [NaN, 0, 0] },
    },
    settings,
  );
  expect(state.settings.geometry).toBe('bust');
  expect(state.settings.ibl).toBe('gallery');
  expect(state.settings.exposure).toBe(0);
  expect(state.settings.intensity).toBe(2);
  expect(state.camera).toBeUndefined();
});
