import { NeutralToneMapping, SRGBColorSpace, WebGPURenderer } from 'three/webgpu';
import type { PerspectiveCamera } from 'three/webgpu';
import type { CleanupScope } from './lifecycle.js';
import type { RenderingSettings } from './renderingSettings.js';

/** Own the renderer before async initialization so replacement/unmount can always clean it up. */
export async function createViewerRenderer(
  scope: CleanupScope,
  options: { width: number; height: number; canvas?: HTMLCanvasElement; updateStyle?: boolean },
) {
  const renderer = new WebGPURenderer({ canvas: options.canvas, antialias: true });
  scope.own(() => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    if (!options.canvas) renderer.domElement.remove();
  });
  renderer.setSize(options.width, options.height, options.updateStyle ?? true);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  await renderer.init();
  return renderer;
}

export function observeViewerResize(
  scope: CleanupScope,
  element: HTMLElement,
  renderer: WebGPURenderer,
  camera: PerspectiveCamera,
  updateStyle = true,
): void {
  const observer = new ResizeObserver(() => {
    const width = element.clientWidth || 512;
    const height = element.clientHeight || 512;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, updateStyle);
  });
  scope.own(() => observer.disconnect());
  observer.observe(element);
}

export function applyViewerRenderingSettings(
  renderer: { toneMappingExposure: number },
  scene: { environmentIntensity: number },
  rendering: { configure(settings: RenderingSettings): void },
  settings: RenderingSettings & { exposure: number; intensity: number },
): void {
  rendering.configure(settings);
  renderer.toneMappingExposure = 2 ** settings.exposure;
  scene.environmentIntensity = settings.intensity;
}
