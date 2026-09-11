/**
 * The complete MaterialX preview viewer: renderer, HDR pipeline, IBL environment, orbit controls,
 * the material scene and the frame loop, driven by one {@link ViewerSettings} object. Hosts supply
 * only I/O (how to fetch environments and geometries, where to log) and UI.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createEnvironmentSwitcher } from './environment.js';
import { CleanupScope } from './lifecycle.js';
import { createViewerRendering } from './rendering.js';
import { IBL_OPTIONS, type ViewerSettings } from './renderingSettings.js';
import { applyViewerRenderingSettings, createViewerRenderer, observeViewerResize } from './runtime.js';
import { createMtlxScene, type MtlxScene } from './scene.js';
import type { PreviewReport } from './diagnostics.js';

export interface ViewerOptions {
  /** Render into this canvas; otherwise a canvas is created and appended to `container`. */
  canvas?: HTMLCanvasElement;
  /** Sized against; a created canvas is appended here. */
  container: HTMLElement;
  data: ArrayBuffer;
  fileName: string;
  shaderBall: ArrayBuffer;
  settings: ViewerSettings;
  loadEnvironment(kind: string): Promise<THREE.Texture>;
  /** Host-configured geometries beyond totem/sphere/plane; `manager` resolves glTF sidecar files. */
  loadGeometry?(name: string): Promise<{ data: ArrayBuffer; manager?: THREE.LoadingManager }>;
  /** Rewrite texture URLs the document references (e.g. to blob: URLs of bytes the host already read). */
  resolveUrl?(url: string): string | undefined;
  onLog?(message: string): void;
  onReport?(report: PreviewReport): void;
  /** Transient status text; empty when cleared. */
  onStatus?(patch: { environment?: string; geometry?: string }): void;
  /** Loading milestones for progress UI. */
  onStage?(stage: 'renderer' | 'environment' | 'material' | 'render' | 'ready'): void;
  /** The frame loop failed after startup; the viewer is already disposed. */
  onError?(message: string): void;
}

export interface Viewer {
  readonly disposed: boolean;
  readonly scene: MtlxScene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  /** Apply a full settings object; only changed fields do work. Resolves to what actually took effect. */
  setSettings(settings: ViewerSettings): Promise<ViewerSettings>;
  dispose(): void;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const environmentLabel = (kind: string) => IBL_OPTIONS.find((option) => option.value === kind)?.label ?? kind;

/** Builds the viewer and renders the first frame; rejects (already disposed) on any setup failure. */
export async function createViewer(options: ViewerOptions): Promise<Viewer> {
  const { container, onLog, onStatus, onStage } = options;
  const scope = new CleanupScope();
  const abort = new AbortController();
  scope.own(() => abort.abort());
  const report: PreviewReport = { state: 'loading', resources: 'unchecked', failedResources: [] };
  const publish = () => options.onReport?.({ ...report, failedResources: [...report.failedResources] });
  publish();
  let applied = { ...options.settings };
  let requestedEnvironment: string | undefined;
  let geometryGeneration = 0;
  const geometryLoads = new Map<string, Promise<void>>();

  try {
    const width = (options.canvas ?? container).clientWidth || 512;
    const height = (options.canvas ?? container).clientHeight || 512;
    onStage?.('renderer');
    onLog?.('Creating WebGPURenderer...');
    const renderer = await createViewerRenderer(scope, {
      width,
      height,
      canvas: options.canvas,
      updateStyle: !options.canvas,
    });
    scope.own(() => renderer.setAnimationLoop(null));
    const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
    onLog?.(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);
    if (!options.canvas) container.replaceChildren(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Material preview. Arrow keys pan the camera.');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
    const rendering = createViewerRendering(renderer, scene, camera, applied);
    scope.own(() => rendering.dispose());
    const applyRendering = (settings: ViewerSettings) =>
      applyViewerRenderingSettings(renderer, scene, rendering, settings);
    applyRendering(applied);

    // @types/three lags three's addon source: fromEquirectangular() isn't in its PMREMGenerator typings yet.
    const pmrem = new THREE.PMREMGenerator(renderer) as unknown as {
      fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
      dispose(): void;
    };
    scope.own(() => pmrem.dispose());
    const environments = createEnvironmentSwitcher(
      options.loadEnvironment,
      (texture) => pmrem.fromEquirectangular(texture),
      (texture) => {
        scene.environment = texture;
        scene.background = texture;
      },
    );
    scope.own(() => environments.dispose());
    const setEnvironment = async (kind: string): Promise<void> => {
      requestedEnvironment = kind;
      onStatus?.({ environment: 'Loading environment…' });
      try {
        if (await environments.set(kind)) {
          applied.ibl = kind;
          onStatus?.({ environment: '' });
          onLog?.(`Environment ready: ${environmentLabel(kind)}.`);
        }
      } catch (error) {
        if (scope.disposed || kind !== requestedEnvironment) return;
        const text = `Environment failed to load: ${message(error)}`;
        onStatus?.({ environment: text });
        onLog?.(text);
        // The bundled studio room is the one environment every host ships, so it is the fallback.
        if (!scene.environment && kind !== 'studio') {
          onLog?.('Using fallback IBL: studio.');
          await setEnvironment('studio');
        }
      }
    };
    onStage?.('environment');
    await setEnvironment(applied.ibl);
    if (scope.disposed) throw new Error('Viewer disposed');

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.listenToKeyEvents(canvas);
    scope.own(() => controls.dispose());
    observeViewerResize(scope, options.canvas ?? container, renderer, camera, !options.canvas);

    onStage?.('material');
    onLog?.(`Parsing MaterialX document (${options.fileName})...`);
    const manager = new THREE.LoadingManager();
    manager.onStart = () => {
      if (scope.disposed) return;
      report.resources = 'loading';
      publish();
    };
    manager.onLoad = () => {
      if (scope.disposed) return;
      report.resources = 'loaded';
      publish();
    };
    manager.onProgress = (url, loaded, total) => onLog?.(`Loading ${url}: ${loaded}/${total}`);
    manager.onError = (url) => {
      if (scope.disposed) return;
      if (!report.failedResources.includes(url)) report.failedResources.push(url);
      publish();
      onLog?.(`Failed to load resource: ${url}`);
    };
    if (options.resolveUrl) manager.setURLModifier((url) => options.resolveUrl!(url) ?? url);
    const mtlxScene = await createMtlxScene(camera, controls, {
      data: options.data,
      fileName: options.fileName,
      shaderBall: options.shaderBall,
      manager,
      autoRotate: applied.rotate,
      materialName: applied.materialName,
    });
    scope.own(() => mtlxScene.dispose());
    if (scope.disposed) throw new Error('Viewer disposed');
    scene.add(mtlxScene.root);
    applied.materialName = mtlxScene.activeMaterial;
    onLog?.(`Material applied (${mtlxScene.materialNames.length} available).`);

    const loadGeometry = async (name: string) => {
      if (mtlxScene.hasGeometry(name)) return;
      if (!options.loadGeometry) throw new Error(`Unknown geometry: ${name}`);
      if (!geometryLoads.has(name))
        geometryLoads.set(
          name,
          options
            .loadGeometry(name)
            .then((asset) => (scope.disposed ? undefined : mtlxScene.addGeometry(name, asset.data, asset.manager)))
            .catch((error: unknown) => {
              geometryLoads.delete(name);
              throw error;
            }),
        );
      await geometryLoads.get(name);
    };
    const setGeometry = async (name: string) => {
      if (mtlxScene.geometry === name) return;
      const request = ++geometryGeneration;
      onStatus?.({ geometry: `Loading geometry: ${name}…` });
      try {
        await loadGeometry(name);
        if (scope.disposed || request !== geometryGeneration) return;
        mtlxScene.setGeometry(name);
        onStatus?.({ geometry: '' });
      } catch (error) {
        if (scope.disposed || request !== geometryGeneration) return;
        const text = `Geometry failed to load: ${message(error)}`;
        onStatus?.({ geometry: text });
        onLog?.(text);
      }
    };
    await setGeometry(applied.geometry);
    if (scope.disposed) throw new Error('Viewer disposed');
    applied.geometry = mtlxScene.geometry;

    onStage?.('render');
    rendering.render(); // A mounted canvas alone does not prove shader compilation succeeded.
    report.state = 'ready';
    publish();
    onStage?.('ready');
    let clock = performance.now();
    renderer.setAnimationLoop(() => {
      const now = performance.now();
      mtlxScene.update((now - clock) / 1000);
      clock = now;
      controls.update();
      try {
        rendering.render();
      } catch (error) {
        scope.dispose();
        report.state = 'error';
        publish();
        options.onError?.(message(error));
      }
    });

    return {
      get disposed() {
        return scope.disposed;
      },
      scene: mtlxScene,
      camera,
      controls,
      async setSettings(next) {
        if (scope.disposed) return applied;
        applyRendering(next);
        Object.assign(applied, {
          bloom: next.bloom,
          ao: next.ao,
          toneMapping: next.toneMapping,
          exposure: next.exposure,
          intensity: next.intensity,
          rotate: next.rotate,
        });
        mtlxScene.autoRotate = next.rotate;
        if (next.materialName && mtlxScene.materialNames.includes(next.materialName)) {
          mtlxScene.setMaterial(next.materialName);
          applied.materialName = next.materialName;
        }
        const pending: Promise<void>[] = [];
        if (next.ibl !== requestedEnvironment) pending.push(setEnvironment(next.ibl));
        if (next.geometry !== mtlxScene.geometry) pending.push(setGeometry(next.geometry));
        await Promise.all(pending);
        applied.geometry = mtlxScene.geometry;
        return { ...applied };
      },
      dispose: () => scope.dispose(),
    };
  } catch (error) {
    scope.dispose();
    report.state = 'error';
    publish();
    throw error;
  }
}
