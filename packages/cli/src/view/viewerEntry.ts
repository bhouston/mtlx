/**
 * Browser-side script for `mtlx view`, bundled by scripts/build-viewer.mjs (esbuild, same
 * pattern as the VS Code extension's build-preview.js). It fetches the target file straight from
 * the local preview server by relative URL — since the server roots its static routes at the
 * file's own directory (see ../view/server.ts), a loose .mtlx's relative texture references
 * resolve as ordinary browser fetches with no remapping needed.
 */
import { createViewer, dataUrlToArrayBuffer, parseEnvironmentFile } from 'mtlx-viewer';
import {
  DEFAULT_VIEWER_SETTINGS,
  TONE_MAPPING_OPTIONS,
  type ToneMappingName,
  type ViewerSettings,
} from 'mtlx-viewer/settings';
// esbuild's dataurl loader (see build-viewer.mjs) inlines this as a base64 data: URL string.
import studioEnvironmentDataUrl from '../../../static-assets/public/viewer/studio-environment.png';

/** One shot requested by `mtlx render`; mirrored by `RenderView` in ../commands/render.ts. */
interface RenderView {
  geometry: string;
  background: 'none' | 'environment';
  /** Visible width in meters (square frame), for head-on plane shots; overrides `zoom`. */
  width?: number;
  zoom?: number;
  /** Camera elevation in degrees: 0 looks straight at the plane, 35 is the default framing. */
  elevation?: number;
  /** UV point to aim at on the plane (UV 0..1 spans the plane). */
  center?: [number, number];
}

declare const window: Window & {
  __MTLX_FILE__?: string;
  __mtlxRender?: (view: RenderView) => Promise<void>;
};

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = element<HTMLCanvasElement>('viewport');
const errorEl = element<HTMLDivElement>('error');
const materialEl = element<HTMLSelectElement>('material-select');
const geometryEl = element<HTMLSelectElement>('geometry-select');
const toneMappingEl = element<HTMLSelectElement>('tone-mapping');
const bloomEl = element<HTMLInputElement>('bloom');
const aoEl = element<HTMLInputElement>('ao');

function showError(message: string): void {
  console.error(`[mtlx view] ${message}`);
  errorEl.textContent = message;
  canvas.dataset.state = 'error';
}
window.addEventListener('error', (event) => showError(`Uncaught error: ${event.message}`));
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as unknown;
  showError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

const fetchBytes = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  return response.arrayBuffer();
};

async function main(): Promise<void> {
  const fileName = window.__MTLX_FILE__;
  if (!fileName) {
    showError('No file specified.');
    return;
  }
  toneMappingEl.replaceChildren(...TONE_MAPPING_OPTIONS.map(({ value, label }) => new Option(label, value)));
  // `mtlx render` drives the page headlessly through query parameters, e.g. ?geometry=sphere&rotate=false.
  const query = new URLSearchParams(window.location.search);
  const settings: ViewerSettings = {
    ...DEFAULT_VIEWER_SETTINGS,
    ibl: query.get('ibl') ?? 'studio',
    exposure: Number(query.get('exposure') ?? 0) || 0,
    rotate: query.get('rotate') !== 'false',
    geometry: query.get('geometry') ?? DEFAULT_VIEWER_SETTINGS.geometry,
    materialName: query.get('material') ?? DEFAULT_VIEWER_SETTINGS.materialName,
    background: query.get('background') === 'none' ? 'none' : 'environment',
    // `mtlx render --channel` shows raw values: no tone mapping or post effects.
    toneMapping: (TONE_MAPPING_OPTIONS.find((o) => o.value === query.get('toneMapping'))?.value ??
      DEFAULT_VIEWER_SETTINGS.toneMapping) as ToneMappingName,
    bloom: query.get('bloom') !== 'false' && DEFAULT_VIEWER_SETTINGS.bloom,
    ao: query.get('ao') !== 'false' && DEFAULT_VIEWER_SETTINGS.ao,
  };
  geometryEl.value = settings.geometry;
  toneMappingEl.value = settings.toneMapping;
  bloomEl.checked = settings.bloom;
  aoEl.checked = settings.ao;

  const [data, shaderBall] = await Promise.all([fetchBytes(fileName), fetchBytes('/__mtlx_view__/shaderball.glb')]);
  const viewer = await createViewer({
    canvas,
    container: canvas,
    data,
    fileName,
    shaderBall,
    settings,
    // studio is inlined; the others are HDRs copied into media/ by scripts/build-viewer.mjs.
    loadEnvironment: async (kind) =>
      kind === 'studio'
        ? parseEnvironmentFile(dataUrlToArrayBuffer(studioEnvironmentDataUrl), 'studio.png')
        : parseEnvironmentFile(await fetchBytes(`/__mtlx_view__/${kind}-environment.hdr`), `${kind}.hdr`),
    onLog: (message) => console.log(`[mtlx view] ${message}`),
    onError: showError,
  });
  window.addEventListener('pagehide', () => viewer.dispose(), { once: true });
  // `mtlx render` compiles once, then calls this per view and screenshots after it resolves.
  window.__mtlxRender = async (view) => {
    await viewer.setSettings({ ...settings, geometry: view.geometry, background: view.background });
    const { camera, controls } = viewer;
    viewer.scene.resetCamera();
    const distance = camera.position.distanceTo(controls.target);
    // The plane is normalized to a unit square in XY facing +Z, so UV (u, v) sits at (u - 0.5, v - 0.5).
    const [x, y] = view.geometry === 'plane' && view.center ? [view.center[0] - 0.5, view.center[1] - 0.5] : [0, 0];
    const elevation = ((view.elevation ?? 35) * Math.PI) / 180;
    controls.target.set(x, y, 0);
    camera.position.set(x, y + distance * Math.sin(elevation), distance * Math.cos(elevation));
    camera.lookAt(x, y, 0);
    const frameWidth = 2 * distance * Math.tan((camera.fov * Math.PI) / 360);
    camera.zoom = view.width ? frameWidth / view.width : (view.zoom ?? 1);
    camera.updateProjectionMatrix();
    controls.update();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };
  if (canvas.dataset.state !== 'error') canvas.dataset.state = 'ready';

  materialEl.replaceChildren(...viewer.scene.materialNames.map((name) => new Option(name, name)));
  materialEl.value = viewer.scene.activeMaterial;
  materialEl.disabled = viewer.scene.materialNames.length <= 1;
  const apply = () =>
    void viewer.setSettings({
      ...settings,
      materialName: materialEl.value,
      geometry: geometryEl.value,
      toneMapping: toneMappingEl.value as ToneMappingName,
      bloom: bloomEl.checked,
      ao: aoEl.checked,
    });
  for (const control of [materialEl, geometryEl, toneMappingEl, bloomEl, aoEl])
    control.addEventListener('change', apply);
}

main().catch((error: unknown) =>
  showError(`MaterialX preview error: ${error instanceof Error ? error.message : String(error)}`),
);
