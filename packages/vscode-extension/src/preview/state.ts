import { parseViewerSettings, type ViewerSettings } from 'mtlx-viewer/settings';
import type { PreviewSettings } from '../previewSettings.js';

export interface PreviewCamera {
  position: number[];
  target: number[];
  zoom: number;
  rotation: number[];
}
/** Persisted per webview via `vscode.setState`. */
export interface PreviewState {
  /** The host configuration these settings were derived from; a change resets to its defaults. */
  settingsKey?: string;
  settings?: Partial<ViewerSettings>;
  camera?: PreviewCamera;
}

/** Viewer settings implied by the host configuration alone. */
export const hostDefaults = (settings: PreviewSettings): ViewerSettings => ({
  ibl: settings.defaultIbl,
  geometry: settings.defaultGeometry,
  rotate: settings.autoRotate,
  bloom: settings.bloom,
  ao: settings.ao,
  toneMapping: settings.toneMapping,
  exposure: 0,
  intensity: 1,
  materialName: '',
});

const vector = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 3 && value.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Validates saved state against the current host configuration; changed host defaults win over saved choices. */
export function normalizePreviewState(
  saved: PreviewState,
  settings: PreviewSettings,
): Required<Pick<PreviewState, 'settingsKey' | 'settings'>> & { settings: ViewerSettings; camera?: PreviewCamera } {
  const settingsKey = JSON.stringify(settings);
  const changed = saved.settingsKey !== settingsKey;
  const defaults = hostDefaults(settings);
  const parsed = parseViewerSettings(
    { ...saved.settings },
    { ibls: settings.ibls.map((asset) => asset.name), geometries: settings.geometries.map((asset) => asset.name) },
  );
  const { exposure, intensity, materialName, ...hostOwned } = parsed;
  const camera = saved.camera;
  return {
    settingsKey,
    settings: {
      ...defaults,
      ...(changed ? {} : hostOwned),
      ...(exposure !== undefined ? { exposure } : {}),
      ...(intensity !== undefined ? { intensity } : {}),
      ...(materialName !== undefined ? { materialName } : {}),
    },
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
