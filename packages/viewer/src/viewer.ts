/**
 * The complete MaterialX preview viewer: renderer, HDR pipeline, IBL environment, orbit controls,
 * the material scene and the frame loop, driven by one {@link ViewerSettings} object. Hosts supply
 * only I/O (how to fetch environments and geometries, where to log) and UI.
 */
import * as THREE from 'three/webgpu';
import { setCanvasDescription } from './accessibility.js';
import { LoadingTracker, type LoadingProgress } from './loadingProgress.js';
import { frameId, time } from 'three/tsl';
import { applyCameraSettings, readCameraSettings } from './camera.js';
import { parseCameraSettings, type CameraSettings } from './cameraSettings.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createViewerEnvironmentSwitcher } from './neutralEnvironment.js';
import { registerHdrTextureHandler } from './hdrTextureHandler.js';
import { CleanupScope } from './lifecycle.js';
import { createViewerRendering } from './rendering.js';
import { IBL_OPTIONS, type ViewerSettings } from './renderingSettings.js';
import { applyViewerRenderingSettings, createViewerRenderer, observeViewerResize } from './runtime.js';
import { createMtlxScene, type MtlxScene } from './scene.js';
import { registerTiffTextureHandler } from './tiffTextureHandler.js';
import type { PreviewReport } from './diagnostics.js';

export interface ViewerOptions {
  /** Cancel an in-progress compilation when an editor supplies a newer document. */
  signal?: AbortSignal;
  /** Render into this canvas; otherwise a canvas is created and appended to `container`. */
  canvas?: HTMLCanvasElement;
  /** Sized against; a created canvas is appended here. */
  container: HTMLElement;
  data: ArrayBuffer;
  fileName: string;
  /** Accessible description of the material, applied to the focusable canvas. */
  alt?: string;
  shaderBall: ArrayBuffer;
  settings: ViewerSettings;
  /** Whether MaterialX `<time>`/`<frame>` nodes advance from the first frame; defaults to true. */
  playing?: boolean;
  loadEnvironment: (kind: string) => Promise<THREE.Texture>;
  /** Host-configured geometries beyond totem/sphere/cube/plane; `manager` resolves glTF sidecar files. */
  loadGeometry?(name: string): Promise<{ data: ArrayBuffer; manager?: THREE.LoadingManager }>;
  /** Rewrite texture URLs the document references (e.g. to blob: URLs of bytes the host already read). */
  resolveUrl?: (url: string) => string | undefined;
  onLog?: (message: string) => void;
  onReport?(report: PreviewReport): void;
  /** Current camera framing after initialization and each orbit/pan/zoom change. */
  onCameraChange?(settings: Required<CameraSettings>): void;
  /** Transient status text; empty when cleared. */
  onStatus?: (patch: { environment?: string; geometry?: string }) => void;
  /** Overall progress for setup, resources, settings changes, and rendering. */
  onProgress?: (progress: LoadingProgress) => void;
  /** Loading milestones for progress UI. */
  onStage?: (stage: 'renderer' | 'environment' | 'material' | 'render' | 'ready') => void;
  /** The frame loop failed after startup; the viewer is already disposed. */
  onError?(message: string): void;
}

export interface Viewer {
  readonly disposed: boolean;
  readonly scene: MtlxScene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  /** Capture current framing, including user orbit, pan and zoom, for a share link. */
  getCameraSettings(): Required<CameraSettings>;
  /** Whether MaterialX `<time>`/`<frame>` nodes run forward; `scene.animated` says whether the document has any. */
  readonly playing: boolean;
  setPlaying(playing: boolean): void;
  /** Update the accessible description without reloading; empty/undefined restores the default. */
  setAlt(alt?: string): void;
  /** Apply a full settings object; only changed fields do work. Resolves to what actually took effect. */
  setSettings(settings: ViewerSettings): Promise<ViewerSettings>;
  /**
   * Compile a new document into the running scene, keeping the renderer, environment, camera and
   * geometry. Reports through `onReport`; throws (and keeps the previous material) on a parse failure.
   */
  replaceMaterial(data: ArrayBuffer, fileName: string): void;
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
  options.signal?.throwIfAborted();
  const cancel = () => scope.dispose();
  options.signal?.addEventListener('abort', cancel, { once: true });
  scope.own(() => options.signal?.removeEventListener('abort', cancel));
  const report: PreviewReport = { state: 'loading', resources: 'unchecked', failedResources: [] };
  const publish = () => options.onReport?.({ ...report, failedResources: [...report.failedResources] });
  publish();
  const tracker = new LoadingTracker((progress) => {
    if (!scope.disposed) options.onProgress?.(progress);
  });
  const startup = tracker.start('material-load');
  let applied = { ...options.settings };
  let requestedEnvironment: string | undefined;
  let geometryGeneration = 0;
  let materialGeneration = 0;
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
    if (scope.disposed) throw new Error('Viewer disposed');
    scope.own(() => renderer.setAnimationLoop(null));
    const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
    onLog?.(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);
    if (!options.canvas) container.replaceChildren(renderer.domElement);
    const canvas = renderer.domElement;
    const previousBackground = canvas.style.backgroundColor;
    scope.own(() => {
      canvas.style.backgroundColor = previousBackground;
    });
    canvas.tabIndex = 0;
    setCanvasDescription(canvas, options.alt);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
    const rendering = createViewerRendering(renderer, scene, camera, applied);
    scope.own(() => rendering.dispose());
    const applyRendering = (settings: ViewerSettings) => {
      applyViewerRenderingSettings(renderer, scene, rendering, settings);
      scene.background = settings.background === 'environment' ? scene.environment : null;
      // CSS white stays white through exposure/tone mapping, just like model-viewer's backdrop.
      canvas.style.backgroundColor = settings.background === 'white' ? '#fff' : 'transparent';
    };
    applyRendering(applied);

    // @types/three lags three's addon source: fromEquirectangular() isn't in its PMREMGenerator typings yet.
    const pmrem = new THREE.PMREMGenerator(renderer) as unknown as {
      fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
      fromScene: (
        scene: THREE.Scene,
        sigma: number,
        near: number,
        far: number,
        options: { size: number },
      ) => { texture: THREE.Texture; dispose(): void };
      dispose(): void;
    };
    scope.own(() => pmrem.dispose());
    const environments = createViewerEnvironmentSwitcher(pmrem, options.loadEnvironment, (texture) => {
      scene.environment = texture;
      applyRendering(applied);
    });
    scope.own(() => environments.dispose());
    const setEnvironment = async (kind: string): Promise<void> => {
      const progress = tracker.start('environment-update');
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
        // The generated studio requires no network assets, so it is the fallback.
        if (!scene.environment && kind !== 'studio') {
          onLog?.('Using fallback IBL: studio.');
          await setEnvironment('studio');
        }
      } finally {
        progress(1);
      }
    };
    startup(0.2);
    onStage?.('environment');
    await setEnvironment(applied.ibl);
    if (scope.disposed) throw new Error('Viewer disposed');

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.listenToKeyEvents(canvas);
    scope.own(() => controls.dispose());
    let reframe = () => {};
    observeViewerResize(scope, options.canvas ?? container, renderer, camera, !options.canvas, () => reframe());

    startup(0.5);
    onStage?.('material');
    onLog?.(`Parsing MaterialX document (${options.fileName})...`);
    const manager = new THREE.LoadingManager();
    let resourceProgress: ((value: number) => void) | undefined;
    let resourcesPending = false;
    let resourceWaiters: (() => void)[] = [];
    const waitForResources = () =>
      resourcesPending ? new Promise<void>((resolve) => resourceWaiters.push(resolve)) : Promise.resolve();
    scope.own(() => {
      for (const resolve of resourceWaiters.splice(0)) resolve();
    });
    manager.onStart = () => {
      if (scope.disposed) return;
      resourcesPending = true;
      resourceProgress ??= tracker.start('material-load');
      report.resources = 'loading';
      publish();
    };
    manager.onLoad = () => {
      if (scope.disposed) return;
      resourcesPending = false;
      resourceProgress?.(1);
      resourceProgress = undefined;
      for (const resolve of resourceWaiters.splice(0)) resolve();
      report.resources = 'loaded';
      publish();
    };
    manager.onProgress = (url, loaded, total) => {
      if (scope.disposed) return;
      resourceProgress?.(Math.min(0.95, loaded / total));
      onLog?.(`Loading ${url}: ${loaded}/${total}`);
    };
    manager.onError = (url) => {
      if (scope.disposed) return;
      if (!report.failedResources.includes(url)) report.failedResources.push(url);
      publish();
      onLog?.(`Failed to load resource: ${url}`);
    };
    registerHdrTextureHandler(manager);
    registerTiffTextureHandler(manager);
    const mtlxScene = await createMtlxScene(camera, controls, {
      data: options.data,
      fileName: options.fileName,
      shaderBall: options.shaderBall,
      manager,
      resolveUrl: options.resolveUrl,
      onTranslationMessage: ({ severity, message: text }) =>
        onLog?.(`WARNING: MaterialX translation ${severity} (material still rendered): ${text}`),
      autoRotate: applied.rotate,
      materialName: applied.materialName,
    });
    scope.own(() => mtlxScene.dispose());
    let cameraSettings = parseCameraSettings(applied);
    const cameraKey = (settings: CameraSettings) =>
      JSON.stringify([settings.cameraOrbit, settings.cameraTarget, settings.fieldOfView]);
    const applyFraming = (settings: CameraSettings) => {
      camera.fov = 45;
      mtlxScene.resetCamera({ resetObjects: false });
      applyCameraSettings(camera, controls, settings);
    };
    reframe = () => {
      // An explicit orbit uses an absolute distance; resizing changes aspect only.
      if (!Object.keys(cameraSettings).length) mtlxScene.reframe();
    };
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
      const progress = tracker.start('geometry-update');
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
      } finally {
        progress(1);
      }
    };
    await setGeometry(applied.geometry);
    if (scope.disposed) throw new Error('Viewer disposed');
    applied.geometry = mtlxScene.geometry;
    if (Object.keys(cameraSettings).length) applyFraming(cameraSettings);
    const cameraChanged = () => options.onCameraChange?.(readCameraSettings(camera, controls));
    controls.addEventListener('change', cameraChanged);
    scope.own(() => controls.removeEventListener('change', cameraChanged));
    cameraChanged();

    await waitForResources();
    if (scope.disposed) throw new Error('Viewer disposed');
    startup(0.9);
    onStage?.('render');
    rendering.render(); // A mounted canvas alone does not prove shader compilation succeeded.
    report.state = 'ready';
    publish();
    onStage?.('ready');
    startup(1);
    // MaterialX time/frame compile to three's shared `time`/`frameId` uniforms, which three advances
    // from wall-clock on every render. Feed them from this clock instead so they can pause.
    // ponytail: the uniforms are module singletons, so the newest viewer on a page owns them.
    let playing = options.playing ?? true;
    let animationTime = 0;
    let animationFrame = 0;
    time.onRenderUpdate(() => animationTime);
    frameId.onRenderUpdate(() => animationFrame);
    scope.own(() => {
      time.onRenderUpdate((frame) => frame.time);
      frameId.onRenderUpdate((frame) => frame.frameId);
    });
    let clock = performance.now();
    void renderer.setAnimationLoop(() => {
      const now = performance.now();
      const delta = (now - clock) / 1000;
      mtlxScene.update(delta);
      if (playing) {
        animationTime += delta;
        animationFrame++;
      }
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
      getCameraSettings: () => readCameraSettings(camera, controls),
      get playing() {
        return playing;
      },
      setAlt(alt) {
        if (!scope.disposed) setCanvasDescription(canvas, alt);
      },
      setPlaying(next) {
        playing = next;
      },
      async setSettings(next) {
        if (scope.disposed) return applied;
        const nextCamera = parseCameraSettings(next);
        if (cameraKey(nextCamera) !== cameraKey(cameraSettings)) {
          cameraSettings = nextCamera;
          applyFraming(cameraSettings);
        }
        Object.assign(applied, {
          cameraOrbit: nextCamera.cameraOrbit,
          cameraTarget: nextCamera.cameraTarget,
          fieldOfView: nextCamera.fieldOfView,
        });
        const materialChanged = !!next.materialName && next.materialName !== applied.materialName;
        applyRendering(next);
        Object.assign(applied, {
          bloom: next.bloom,
          ao: next.ao,
          toneMapping: next.toneMapping,
          background: next.background,
          exposure: next.exposure,
          intensity: next.intensity,
          rotate: next.rotate,
        });
        mtlxScene.autoRotate = next.rotate;
        if (next.materialName && mtlxScene.materialNames.includes(next.materialName)) {
          mtlxScene.setMaterial(next.materialName);
          applied.materialName = next.materialName;
        }
        const changed = next.ibl !== requestedEnvironment || next.geometry !== mtlxScene.geometry || materialChanged;
        const progress = changed
          ? tracker.start(
              next.ibl !== requestedEnvironment
                ? 'environment-update'
                : next.geometry !== mtlxScene.geometry
                  ? 'geometry-update'
                  : 'material-load',
            )
          : undefined;
        const pending: Promise<void>[] = [];
        if (next.ibl !== requestedEnvironment) pending.push(setEnvironment(next.ibl));
        if (next.geometry !== mtlxScene.geometry) pending.push(setGeometry(next.geometry));
        await Promise.all(pending);
        if (progress && !scope.disposed) {
          await waitForResources();
          if (!scope.disposed) {
            rendering.render();
            progress(1);
          }
        }
        applied.geometry = mtlxScene.geometry;
        return { ...applied };
      },
      replaceMaterial(data, fileName) {
        if (scope.disposed) return;
        const generation = ++materialGeneration;
        const progress = tracker.start('material-load');
        onStage?.('material');
        onLog?.(`Parsing MaterialX document (${fileName})...`);
        Object.assign(report, { state: 'loading', resources: 'unchecked', failedResources: [] });
        publish();
        try {
          mtlxScene.replaceMaterials(data, fileName);
          applied.materialName = mtlxScene.activeMaterial;
          onStage?.('render');
          rendering.render();
        } catch (error) {
          tracker.reset();
          report.state = 'error';
          publish();
          throw error;
        }
        onLog?.(`Material applied (${mtlxScene.materialNames.length} available).`);
        void waitForResources()
          .then(() => {
            if (scope.disposed) return;
            rendering.render();
            progress(1);
            if (generation !== materialGeneration) return;
            report.state = 'ready';
            publish();
            onStage?.('ready');
          })
          .catch((error: unknown) => {
            if (scope.disposed || generation !== materialGeneration) return;
            tracker.reset();
            report.state = 'error';
            publish();
            options.onError?.(message(error));
          });
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
