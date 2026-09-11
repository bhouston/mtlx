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
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

declare const window: Window & { __MTLX_FILE__?: string };

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
  const settings: ViewerSettings = { ...DEFAULT_VIEWER_SETTINGS, ibl: 'studio', rotate: true };
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
    loadEnvironment: () => parseEnvironmentFile(dataUrlToArrayBuffer(studioEnvironmentDataUrl), 'studio.png'),
    onLog: (message) => console.log(`[mtlx view] ${message}`),
    onError: showError,
  });
  window.addEventListener('pagehide', () => viewer.dispose(), { once: true });

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
