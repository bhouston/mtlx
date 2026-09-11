import {
  createViewerRendering,
  applyViewerRenderingSettings,
  TONE_MAPPING_OPTIONS,
  type RenderingSettings,
  type CleanupScope,
} from 'mtlx-viewer';
import type { WebGPURenderer, Scene, PerspectiveCamera } from 'three/webgpu';
import type { PreviewState } from './state.js';
import type { PreviewSettings } from '../previewSettings.js';

export function bindRenderingControls(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  scope: CleanupScope,
  state: PreviewState,
  settings: PreviewSettings,
  persist: () => void,
) {
  const own = (release: () => void) => scope.own(release);
  const rendering = createViewerRendering(renderer, scene, camera, {
    bloom: state.bloom ?? settings.bloom,
    ao: state.ao ?? settings.ao,
    toneMapping: state.toneMapping ?? settings.toneMapping,
  });
  own(() => rendering.dispose());
  const bloomEl = document.getElementById('bloom') as HTMLInputElement;
  const aoEl = document.getElementById('ao') as HTMLInputElement;
  const toneMappingEl = document.getElementById('tone-mapping') as HTMLSelectElement;
  toneMappingEl.replaceChildren(...TONE_MAPPING_OPTIONS.map(({ value, label }) => new Option(label, value)));
  bloomEl.checked = state.bloom ?? settings.bloom;
  aoEl.checked = state.ao ?? settings.ao;
  toneMappingEl.value = state.toneMapping ?? settings.toneMapping;
  const applyRendering = () => {
    state.bloom = bloomEl.checked;
    state.ao = aoEl.checked;
    state.toneMapping = toneMappingEl.value as RenderingSettings['toneMapping'];
    rendering.configure({ bloom: state.bloom, ao: state.ao, toneMapping: state.toneMapping });
    persist();
  };
  for (const element of [bloomEl, aoEl, toneMappingEl]) {
    element.addEventListener('change', applyRendering);
    own(() => element.removeEventListener('change', applyRendering));
  }
  const exposureEl = document.getElementById('exposure') as HTMLInputElement;
  const environmentEl = document.getElementById('environment') as HTMLInputElement;
  exposureEl.value = String(state.exposure ?? 0);
  environmentEl.value = String(state.environmentIntensity ?? 1);
  const applyLighting = () => {
    state.exposure = Number(exposureEl.value);
    state.environmentIntensity = Number(environmentEl.value);
    applyViewerRenderingSettings(renderer, scene, rendering, {
      bloom: state.bloom ?? settings.bloom,
      ao: state.ao ?? settings.ao,
      toneMapping: state.toneMapping ?? settings.toneMapping,
      exposure: state.exposure,
      intensity: state.environmentIntensity,
    });
    persist();
  };
  applyLighting();
  exposureEl.addEventListener('input', applyLighting);
  environmentEl.addEventListener('input', applyLighting);
  own(() => {
    exposureEl.removeEventListener('input', applyLighting);
    environmentEl.removeEventListener('input', applyLighting);
  });
  return rendering;
}
