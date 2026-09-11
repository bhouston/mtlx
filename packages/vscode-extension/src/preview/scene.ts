import { bindEnvironmentControls } from './environment-controls.js';
import { bindSceneControls } from './scene-controls.js';
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMtlxScene, CleanupScope, createViewerRenderer, observeViewerResize, type MtlxScene } from 'mtlx-viewer';
// esbuild's dataurl loader (see build-preview.js) inlines this as a base64 data: URL string.
import { type PreviewSettings } from '../previewSettings.js';

import { vscode, requestAsset } from './host.js';
import { previewState } from './state.js';
import { log, showError, setPreviewStatus, recordFailedResource, clearError } from './diagnostics.js';
import type { PreviewTexture } from './protocol.js';
import { bindRenderingControls } from './settings-controls.js';

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;
const rotationEl = document.getElementById('rotation') as HTMLInputElement;
let disposeCurrent = () => {};
export function disposeScene(): void {
  disposeCurrent();
}

function populateMaterialSelect(scene: MtlxScene): void {
  materialSelectEl.replaceChildren(...scene.materialNames.map((name) => new Option(name, name)));
  materialSelectEl.value = scene.activeMaterial;
  materialSelectEl.disabled = scene.materialNames.length <= 1;
}

export async function renderScene(
  data: ArrayBuffer,
  fileName: string,
  textures: PreviewTexture[],
  shaderBall: ArrayBuffer,
  settings: PreviewSettings,
): Promise<void> {
  disposeCurrent();
  const scope = new CleanupScope();
  const own = (release: () => void) => scope.own(release);
  disposeCurrent = () => scope.dispose();
  clearError();
  setPreviewStatus('loading');
  rotationEl.disabled = true;
  const width = canvasEl.clientWidth || 512;
  const height = canvasEl.clientHeight || 512;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);

  log('Creating WebGPURenderer...');
  const renderer = await createViewerRenderer(scope, { width, height, canvas: canvasEl, updateStyle: false });
  if (scope.disposed) return;
  const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
  log(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);

  const assetSignal = await bindEnvironmentControls(renderer, scene, scope, settings);
  if (scope.disposed) return;

  const rendering = bindRenderingControls(renderer, scene, camera, scope, previewState, settings, () =>
    vscode?.setState(previewState),
  );
  const controls = new OrbitControls(camera, renderer.domElement);
  own(() => controls.dispose());
  controls.enableDamping = true;
  controls.listenToKeyEvents(canvasEl);

  observeViewerResize(scope, canvasEl, renderer, camera, false);

  let clock = performance.now();
  let mtlxScene: MtlxScene | undefined;
  const geometryLoads = new Map<string, Promise<void>>();
  const loadGeometry = async (name: string) => {
    if (!settings.geometries.some((asset) => asset.name === name)) return;
    if (!geometryLoads.has(name))
      geometryLoads.set(
        name,
        (async () => {
          const asset = await requestAsset('geometry', name, assetSignal);
          if (scope.disposed) return;
          const manager = new THREE.LoadingManager();
          const urls = new Map(
            asset.resources.map((resource) => [resource.path, URL.createObjectURL(new Blob([resource.data]))]),
          );
          own(() => {
            for (const url of urls.values()) URL.revokeObjectURL(url);
          });
          manager.setURLModifier((url) => urls.get(url) ?? url);
          await mtlxScene!.addGeometry(name, asset.data, manager);
        })().catch((error: unknown) => {
          geometryLoads.delete(name);
          throw error;
        }),
      );
    await geometryLoads.get(name);
  };
  geometrySelectEl.replaceChildren(
    ...['totem', 'sphere', 'plane', ...settings.geometries.map((asset) => asset.name)].map(
      (name) => new Option(name, name),
    ),
  );

  try {
    log(`Parsing MaterialX document (${fileName})...`);
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => log(`Loading ${url}: ${loaded}/${total}`);
    manager.onError = (url) => {
      if (scope.disposed) return;
      recordFailedResource(url);
    };

    // A loose .mtlx references sibling texture files by relative path (e.g.
    // "textures/wood_color.jpg") that don't exist as fetchable URLs inside the webview — the
    // extension host already read their bytes from disk (see mtlxPreviewProvider), so rewrite
    // those exact paths to in-memory blob: URLs before the loader ever requests them. three's
    // ImageLoader/ImageBitmapLoader both route every texture URL through
    // `manager.resolveURL()`, which is what setURLModifier hooks into — no three.js patch needed.
    // A zip-packaged .mtlx.zip resolves its textures from inside the archive on its own and
    // never reaches this map, so it's a no-op there.
    if (textures.length) {
      const textureUrls = new Map(textures.map((t) => [t.path, URL.createObjectURL(new Blob([t.data]))]));
      own(() => {
        for (const url of textureUrls.values()) URL.revokeObjectURL(url);
      });
      manager.setURLModifier((url) => {
        const normalized = new URL(url, 'https://mtlx.invalid/').href.slice('https://mtlx.invalid/'.length);
        return textureUrls.get(url) ?? textureUrls.get(normalized) ?? url;
      });
      log(`Embedded ${textureUrls.size} referenced texture(s) from disk.`);
    }

    mtlxScene = await createMtlxScene(camera, controls, { data, fileName, shaderBall, manager });
    const loadedScene = mtlxScene;
    own(() => loadedScene.dispose());
    if (scope.disposed) return;
    if (previewState.material && mtlxScene.materialNames.includes(previewState.material))
      mtlxScene.setMaterial(previewState.material);
    const initialGeometry = previewState.geometry ?? settings.defaultGeometry;
    try {
      await loadGeometry(initialGeometry);
    } catch (error) {
      if (scope.disposed) return;
      log(`Geometry ${initialGeometry}: ${error instanceof Error ? error.message : String(error)}. Using totem.`);
      delete previewState.camera;
    }
    if (scope.disposed) return;
    mtlxScene.setGeometry(initialGeometry);
    previewState.geometry = mtlxScene.geometry;
    geometrySelectEl.value = mtlxScene.geometry;
    scene.add(mtlxScene.root);
    populateMaterialSelect(mtlxScene);
    log(`Material applied (${mtlxScene.materialNames.length} available).`);
  } catch (error) {
    if (scope.disposed) return;
    disposeCurrent();
    showError(`MaterialX parse error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  bindSceneControls(mtlxScene, camera, controls, scope, settings, loadGeometry);
  await rendering.render();
  if (scope.disposed) return;
  rotationEl.disabled = false;
  setPreviewStatus('ready');
  clock = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const deltaSeconds = (now - clock) / 1000;
    clock = now;
    mtlxScene?.update(deltaSeconds);
    controls.update();
    void rendering.render().catch((error: unknown) => {
      if (scope.disposed) return;
      disposeCurrent();
      showError(error instanceof Error ? error.message : String(error));
    });
  });
}
