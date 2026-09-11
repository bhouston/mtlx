import type { RenderingSettings, GeometryKind } from 'mtlx-viewer';
export interface PreviewState extends Partial<RenderingSettings> {
  material?: string;
  geometry?: GeometryKind;
  rotating?: boolean;
  exposure?: number;
  environmentIntensity?: number;
  environmentKind?: string;
  settingsKey?: string;
  camera?: { position: number[]; target: number[]; zoom: number; rotation: number[] };
}

import { parseViewerSettings } from 'mtlx-viewer/settings';
import type { PreviewSettings } from '../previewSettings.js';
import { vscode } from './host.js';

/** Keep the existing VS Code storage keys so saved previews survive upgrades. */
export const previewState: PreviewState = vscode?.getState() ?? {};

export function normalizePreviewState(saved: PreviewState, settings: PreviewSettings): PreviewState {
  const settingsKey = JSON.stringify(settings);
  const changed = saved.settingsKey !== settingsKey;
  const parsed = parseViewerSettings(
    {
      ibl: changed ? settings.defaultIbl : saved.environmentKind,
      geometry: changed ? settings.defaultGeometry : saved.geometry,
      rotate: changed ? settings.autoRotate : saved.rotating,
      bloom: changed ? settings.bloom : saved.bloom,
      ao: changed ? settings.ao : saved.ao,
      toneMapping: changed ? settings.toneMapping : saved.toneMapping,
      exposure: saved.exposure,
      intensity: saved.environmentIntensity,
      materialName: saved.material,
    },
    { ibls: settings.ibls.map((asset) => asset.name), geometries: settings.geometries.map((asset) => asset.name) },
  );
  const vector = (value: unknown): value is number[] =>
    Array.isArray(value) && value.length === 3 && value.every((n) => typeof n === 'number' && Number.isFinite(n));
  const camera = saved.camera;
  return {
    settingsKey,
    environmentKind: parsed.ibl ?? settings.defaultIbl,
    geometry: parsed.geometry ?? settings.defaultGeometry,
    rotating: parsed.rotate ?? settings.autoRotate,
    bloom: parsed.bloom ?? settings.bloom,
    ao: parsed.ao ?? settings.ao,
    toneMapping: parsed.toneMapping ?? settings.toneMapping,
    exposure: parsed.exposure ?? 0,
    environmentIntensity: parsed.intensity ?? 1,
    material: parsed.materialName,
    camera:
      !changed &&
      camera &&
      vector(camera.position) &&
      vector(camera.target) &&
      vector(camera.rotation) &&
      typeof camera.zoom === 'number' &&
      Number.isFinite(camera.zoom) &&
      camera.zoom > 0
        ? camera
        : undefined,
  };
}

export function restorePreviewSettings(settings: PreviewSettings): void {
  Object.assign(previewState, normalizePreviewState(previewState, settings));
}
