import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createMtlxScene,
  CleanupScope,
  createViewerRenderer,
  createViewerRendering,
  applyViewerRenderingSettings,
  observeViewerResize,
  parseEnvironment,
  parseEnvironmentFile,
  createEnvironmentSwitcher,
  type MtlxScene,
  type RenderingSettings,
} from 'mtlx-viewer';
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';
import type { PreviewSettings } from '../previewSettings.js';
import { requestAsset } from './host.js';
import type { PreviewState } from './state.js';
import { log, showError, clearError, setReport, setStatus, recordFailedResource } from './diagnostics.js';
import type { PreviewTexture } from './protocol.js';

export interface PreviewSceneOptions {
  canvas: HTMLCanvasElement;
  data: ArrayBuffer;
  fileName: string;
  textures: PreviewTexture[];
  shaderBall: ArrayBuffer;
  settings: PreviewSettings;
  /** Mutable persisted state shared with the UI; `persist` saves it and re-renders. */
  state: PreviewState;
  persist: () => void;
}

export interface PreviewScene {
  /** Resolves once the first frame rendered (or the scene failed and reported the error). */
  ready: Promise<void>;
  readonly disposed: boolean;
  setMaterial(name: string): void;
  setGeometry(name: string): Promise<void>;
  setRotating(on: boolean): void;
  setEnvironment(kind: string): Promise<void>;
  applyRendering(values: RenderingSettings & { exposure: number; intensity: number }): void;
  dispose(): void;
}

const ENVIRONMENT_LABELS: Record<string, string> = { studio: 'Studio', bridge: 'San Giuseppe Bridge' };

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Owns renderer, environment, controls, and material scene for one document payload. */
export function startPreviewScene(options: PreviewSceneOptions): PreviewScene {
  const { canvas, data, fileName, textures, shaderBall, settings, state, persist } = options;
  const scope = new CleanupScope();
  const own = (release: () => void) => scope.own(release);
  const environmentAbort = new AbortController();
  own(() => environmentAbort.abort());
  let scene: THREE.Scene | undefined;
  let camera: THREE.PerspectiveCamera | undefined;
  let controls: OrbitControls | undefined;
  let mtlxScene: MtlxScene | undefined;
  let rendering: ReturnType<typeof createViewerRendering> | undefined;
  let renderer: THREE.WebGPURenderer | undefined;
  let environments: ReturnType<typeof createEnvironmentSwitcher> | undefined;
  let currentEnvironment: string | undefined;
  let geometryGeneration = 0;
  const geometryLoads = new Map<string, Promise<void>>();

  const saveCamera = () => {
    if (!camera || !controls) return;
    const object = mtlxScene?.root.children.find((child) => child.visible);
    state.camera = {
      position: camera.position.toArray(),
      target: controls.target.toArray(),
      zoom: camera.zoom,
      rotation: object ? [object.rotation.x, object.rotation.y, object.rotation.z] : [0, 0, 0],
    };
    persist();
  };

  const loadGeometry = async (name: string) => {
    if (!settings.geometries.some((asset) => asset.name === name)) return;
    if (!geometryLoads.has(name))
      geometryLoads.set(
        name,
        (async () => {
          const asset = await requestAsset('geometry', name, environmentAbort.signal);
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

  const changeEnvironment = async (kind: string): Promise<void> => {
    if (!environments || !scene) return;
    currentEnvironment = kind;
    setStatus({ environmentStatus: 'Loading environment…' });
    try {
      if (await environments.set(kind)) {
        setStatus({ environmentStatus: '' });
        log(`Environment ready: ${ENVIRONMENT_LABELS[kind] ?? kind}.`);
      }
    } catch (error) {
      if (scope.disposed || kind !== state.environmentKind) return;
      const message = `Environment failed to load: ${error instanceof Error ? error.message : String(error)}`;
      setStatus({ environmentStatus: message });
      log(message);
      if (!scene.environment && kind !== 'studio') {
        state.environmentKind = kind === 'bridge' ? 'studio' : 'bridge';
        persist();
        log(`Using fallback IBL: ${state.environmentKind}.`);
        await changeEnvironment(state.environmentKind);
      }
    }
  };

  const applyRendering = (values: RenderingSettings & { exposure: number; intensity: number }) => {
    if (renderer && scene && rendering) applyViewerRenderingSettings(renderer, scene, rendering, values);
  };

  const ready = (async () => {
    clearError();
    setReport({ state: 'loading' });
    const width = canvas.clientWidth || 512;
    const height = canvas.clientHeight || 512;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);

    log('Creating WebGPURenderer...');
    renderer = await createViewerRenderer(scope, { width, height, canvas, updateStyle: false });
    if (scope.disposed) return;
    const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
    log(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);

    const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
      fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
      dispose(): void;
    };
    own(() => pmremGenerator.dispose());
    const target = scene;
    environments = createEnvironmentSwitcher(
      async (kind) => {
        if (kind === 'studio') return parseEnvironment(kind, dataUrlToArrayBuffer(studioEnvironmentDataUrl));
        if (kind === 'bridge') {
          const response = await fetch(document.body.dataset.hdrUrl!, { signal: environmentAbort.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status} loading IBL`);
          return parseEnvironment('default', await response.arrayBuffer());
        }
        const asset = await requestAsset('ibl', kind, environmentAbort.signal);
        return parseEnvironmentFile(asset.data, asset.source);
      },
      (texture) => pmremGenerator.fromEquirectangular(texture),
      (texture) => {
        target.environment = texture;
        target.background = texture;
      },
    );
    own(() => environments!.dispose());
    await changeEnvironment(state.environmentKind ?? settings.defaultIbl);
    if (scope.disposed) return;

    rendering = createViewerRendering(renderer, scene, camera, {
      bloom: state.bloom ?? settings.bloom,
      ao: state.ao ?? settings.ao,
      toneMapping: state.toneMapping ?? settings.toneMapping,
    });
    own(() => rendering!.dispose());
    applyRendering({
      bloom: state.bloom ?? settings.bloom,
      ao: state.ao ?? settings.ao,
      toneMapping: state.toneMapping ?? settings.toneMapping,
      exposure: state.exposure ?? 0,
      intensity: state.environmentIntensity ?? 1,
    });
    controls = new OrbitControls(camera, renderer.domElement);
    own(() => controls!.dispose());
    controls.enableDamping = true;
    controls.listenToKeyEvents(canvas);
    observeViewerResize(scope, canvas, renderer, camera, false);

    try {
      log(`Parsing MaterialX document (${fileName})...`);
      const manager = new THREE.LoadingManager();
      manager.onStart = () => {
        if (!scope.disposed) setReport({ resources: 'loading' });
      };
      manager.onLoad = () => {
        if (!scope.disposed) setReport({ resources: 'loaded' });
      };
      manager.onProgress = (url, loaded, total) => log(`Loading ${url}: ${loaded}/${total}`);
      manager.onError = (url) => {
        if (!scope.disposed) recordFailedResource(url);
      };
      // A loose .mtlx references sibling texture files by relative path that don't exist as
      // fetchable URLs inside the webview — the extension host already read their bytes, so
      // rewrite those paths to blob: URLs via the manager's URL modifier. A .mtlx.zip resolves
      // its textures from inside the archive and never reaches this map.
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
      // Rotation is applied by the UI once the scene is ready (it also honours reduced-motion).
      mtlxScene = await createMtlxScene(camera, controls, { data, fileName, shaderBall, manager, autoRotate: false });
      const loaded = mtlxScene;
      own(() => loaded.dispose());
      if (scope.disposed) return;
      if (state.material && mtlxScene.materialNames.includes(state.material)) mtlxScene.setMaterial(state.material);
      const initialGeometry = state.geometry ?? settings.defaultGeometry;
      try {
        await loadGeometry(initialGeometry);
      } catch (error) {
        if (scope.disposed) return;
        log(`Geometry ${initialGeometry}: ${error instanceof Error ? error.message : String(error)}. Using totem.`);
        delete state.camera;
      }
      if (scope.disposed) return;
      mtlxScene.setGeometry(initialGeometry);
      state.geometry = mtlxScene.geometry;
      state.material = mtlxScene.activeMaterial;
      scene.add(mtlxScene.root);
      setStatus({ materials: mtlxScene.materialNames });
      log(`Material applied (${mtlxScene.materialNames.length} available).`);
    } catch (error) {
      if (scope.disposed) return;
      scope.dispose();
      showError(`MaterialX parse error: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    const saved = state.camera;
    if (saved) {
      camera.position.fromArray(saved.position);
      camera.zoom = saved.zoom;
      camera.updateProjectionMatrix();
      controls.target.fromArray(saved.target);
      mtlxScene.root.children
        .find((child) => child.visible)
        ?.rotation.set(saved.rotation[0]!, saved.rotation[1]!, saved.rotation[2]!);
      controls.update();
    }
    const orbit = controls;
    orbit.addEventListener('end', saveCamera);
    own(() => {
      saveCamera();
      orbit.removeEventListener('end', saveCamera);
    });
    persist();

    await rendering.render();
    if (scope.disposed) return;
    setReport({ state: 'ready' });
    let clock = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      mtlxScene?.update((now - clock) / 1000);
      clock = now;
      orbit.update();
      void rendering!.render().catch((error: unknown) => {
        if (scope.disposed) return;
        scope.dispose();
        showError(error instanceof Error ? error.message : String(error));
      });
    });
  })().catch((error: unknown) => {
    if (scope.disposed) return;
    scope.dispose();
    showError(`3D preview error: ${error instanceof Error ? error.message : String(error)}`);
  });

  return {
    ready,
    get disposed() {
      return scope.disposed;
    },
    setMaterial(name) {
      if (mtlxScene && mtlxScene.activeMaterial !== name && mtlxScene.materialNames.includes(name))
        mtlxScene.setMaterial(name);
    },
    async setGeometry(name) {
      if (!mtlxScene || mtlxScene.geometry === name) return;
      const request = ++geometryGeneration;
      setStatus({ geometryStatus: `Loading geometry: ${name}…` });
      try {
        await loadGeometry(name);
        if (scope.disposed || request !== geometryGeneration) return;
        mtlxScene.setGeometry(name);
        setStatus({ geometryStatus: '' });
        saveCamera();
      } catch (error) {
        if (scope.disposed || request !== geometryGeneration) return;
        const message = `Geometry failed to load: ${error instanceof Error ? error.message : String(error)}`;
        setStatus({ geometryStatus: message });
        log(message);
        state.geometry = mtlxScene.geometry;
        persist();
      }
    },
    setRotating(on) {
      if (mtlxScene) mtlxScene.autoRotate = on;
    },
    async setEnvironment(kind) {
      if (kind !== currentEnvironment) await changeEnvironment(kind);
    },
    applyRendering,
    dispose: () => scope.dispose(),
  };
}
