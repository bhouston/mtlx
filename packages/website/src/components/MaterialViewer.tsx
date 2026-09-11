import { DEFAULT_VIEWER_SETTINGS, type ViewerSettings } from '@/lib/viewer-search';
import { MaterialLoadingOverlay } from './MaterialLoadingOverlay';
import type { MaterialLoadProgress } from '@/lib/material-load';
import { analyzeInWorker } from '@/lib/analyze-in-worker';
import { materialByteLimit, readBoundedResponse } from '@/lib/material-bytes';
import { CleanupScope } from 'mtlx-viewer/lifecycle';
import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three/webgpu';
import { MaterialSelect, ViewerSettingsPanel } from 'mtlx-viewer/react';
import type { MtlxScene } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';
import defaultEnvironmentUrl from 'mtlx-viewer/assets/default-environment.hdr?url';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

export type MaterialSource =
  | { kind: 'buffer'; data: ArrayBuffer; name: string }
  | { kind: 'url'; folderUrl: string; fileName: string };

import type { PreviewReport } from 'mtlx-viewer/diagnostics';
export type { PreviewReport } from 'mtlx-viewer/diagnostics';

export interface MaterialViewerProps {
  source: MaterialSource | null;
  settings?: ViewerSettings;
  onSettingsChange?: (patch: Partial<ViewerSettings>) => void;
  loadProgress?: MaterialLoadProgress | null;
  onError: (message: string | null) => void;
  /** Diagnostics for the log panel — mirrors the VS Code extension's webview log. */
  onLog?: (message: string) => void;
  onStatus?: (report: PreviewReport) => void;
}

async function resolveSourceBytes(
  source: MaterialSource,
  signal: AbortSignal,
): Promise<{ data: ArrayBuffer; fileName: string }> {
  if (source.kind === 'buffer') {
    return { data: source.data, fileName: source.name };
  }
  // Pass the full URL (not just the bare filename) as MaterialXLoader's resource path — it
  // derives the texture base folder from everything before the last "/", the same way
  // `.setPath(folderUrl).loadAsync(fileName)` used to; the browser can then fetch a preset's
  // sibling textures (e.g. wood_grain's) directly from raw.githubusercontent.com by relative URL.
  const url = `${source.folderUrl}${source.fileName}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  const data = await readBoundedResponse(response, materialByteLimit(source.fileName), signal);
  const result = await analyzeInWorker(data, source.fileName, signal, response.url || url);
  if (result.analysis.parseError) throw new Error(result.analysis.parseError);
  return { data: result.data, fileName: response.url || url };
}

// three.js 0.186's MaterialXLoader (via mtlx-viewer's createMtlxScene) natively understands
// .mtlx and .mtlx.zip (it sniffs the zip magic bytes / filename) and resolves textures
// embedded in the archive itself, so this component doesn't need any zip handling of its own.
export function MaterialViewer({
  source,
  loadProgress,
  onError,
  onLog,
  onStatus,
  settings,
  onSettingsChange,
}: MaterialViewerProps) {
  const [renderProgress, setRenderProgress] = useState<MaterialLoadProgress>({
    value: 80,
    label: 'Preparing preview…',
  });
  const [localSettings, setLocalSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);
  const currentSettings = settings ?? localSettings;
  const updateSettings = (patch: Partial<ViewerSettings>) => {
    if (onSettingsChange) onSettingsChange(patch);
    else setLocalSettings((current) => ({ ...current, ...patch }));
  };
  const {
    ibl: environmentKind,
    exposure,
    intensity: environmentIntensity,
    rotate: rotating,
    geometry,
    materialName,
  } = currentSettings;
  const { bloom, ao, toneMapping } = currentSettings;
  const renderingSettings = { bloom, ao, toneMapping };
  const environmentKindRef = useRef(environmentKind);
  environmentKindRef.current = environmentKind;
  const switchEnvironmentRef = useRef<((kind: string) => Promise<void>) | null>(null);
  const [environmentMessage, setEnvironmentMessage] = useState('');
  const settingsRef = useRef({ exposure, environmentIntensity, renderingSettings, geometry, materialName });
  settingsRef.current = { exposure, environmentIntensity, renderingSettings, geometry, materialName };
  const applySettingsRef = useRef<(() => void) | null>(null);
  useEffect(() => applySettingsRef.current?.(), [exposure, environmentIntensity, bloom, ao, toneMapping]);
  useEffect(() => {
    void switchEnvironmentRef.current?.(environmentKind);
  }, [environmentKind]);
  useEffect(() => {
    mtlxSceneRef.current?.setGeometry(geometry);
  }, [geometry]);
  const frameRef = useRef<HTMLDivElement>(null);
  const rotatingRef = useRef(rotating);
  rotatingRef.current = rotating;
  useEffect(() => {
    if (mtlxSceneRef.current) mtlxSceneRef.current.autoRotate = rotating;
  }, [rotating]);
  const statusCallback = useRef(onStatus);
  statusCallback.current = onStatus;
  const containerRef = useRef<HTMLDivElement>(null);
  const mtlxSceneRef = useRef<MtlxScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [activeMaterial, setActiveMaterial] = useState('');
  useEffect(() => {
    const scene = mtlxSceneRef.current;
    if (scene && materialName && scene.materialNames.includes(materialName)) {
      scene.setMaterial(materialName);
      setActiveMaterial(materialName);
    }
  }, [materialName]);

  useEffect(() => {
    const container = containerRef.current;
    mtlxSceneRef.current = null;
    setMaterialNames([]);
    setActiveMaterial('');
    const report: PreviewReport = { state: source ? 'loading' : 'idle', resources: 'unchecked', failedResources: [] };
    const publish = () => {
      setPreviewState(report.state);
      statusCallback.current?.({ ...report, failedResources: [...report.failedResources] });
    };
    publish();
    if (!container || !source) {
      setLoading(false);
      return;
    }

    let disposed = false;
    const abort = new AbortController();
    const scope = new CleanupScope();
    const own = (release: () => void) => scope.own(release);
    own(() => abort.abort());
    const cleanup = () => scope.dispose();
    const fetchBytes = async (url: string) => {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
      return response.arrayBuffer();
    };
    setRenderProgress({ value: 80, label: 'Preparing preview…' });
    setLoading(true);
    onError(null);

    (async () => {
      const THREE: typeof ThreeNS = await import('three/webgpu');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const {
        createMtlxScene,
        parseEnvironment,
        createEnvironmentSwitcher,
        createViewerRendering,
        createViewerRenderer,
        observeViewerResize,
        applyViewerRenderingSettings,
      } = await import('mtlx-viewer');
      if (disposed) return;

      const width = container.clientWidth || 512;
      const height = container.clientHeight || 512;

      onLog?.('Creating WebGPURenderer...');
      const renderer = await createViewerRenderer(scope, { width, height });
      if (disposed) return;
      const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
      onLog?.(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);
      container.replaceChildren(renderer.domElement);

      setRenderProgress({ value: 85, label: 'Loading lighting…' });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
      const rendering = createViewerRendering(renderer, scene, camera, settingsRef.current.renderingSettings);
      own(() => rendering.dispose());
      const applySettings = () => {
        applyViewerRenderingSettings(renderer, scene, rendering, {
          ...settingsRef.current.renderingSettings,
          exposure: settingsRef.current.exposure,
          intensity: settingsRef.current.environmentIntensity,
        });
      };
      applySettingsRef.current = applySettings;
      applySettings();
      own(() => {
        if (applySettingsRef.current === applySettings) applySettingsRef.current = null;
      });
      const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
        fromEquirectangular: (texture: ThreeNS.Texture) => { texture: ThreeNS.Texture; dispose(): void };
        dispose(): void;
      };
      own(() => pmremGenerator.dispose());
      const environments = createEnvironmentSwitcher(
        async (kind) =>
          parseEnvironment(
            kind === 'studio' ? 'studio' : 'default',
            await fetchBytes(kind === 'studio' ? studioEnvironmentUrl : defaultEnvironmentUrl),
          ),
        (texture) => pmremGenerator.fromEquirectangular(texture),
        (texture) => {
          scene.environment = texture;
          scene.background = texture;
        },
      );
      own(() => environments.dispose());
      const switchEnvironment = async (kind: string) => {
        setEnvironmentMessage('Loading environment…');
        try {
          if (await environments.set(kind)) {
            setEnvironmentMessage('');
            onLog?.(`Environment ready: ${kind}.`);
          }
        } catch (error) {
          if (disposed || scope.disposed || kind !== environmentKindRef.current) return;
          setEnvironmentMessage(
            `Environment failed to load: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      };
      switchEnvironmentRef.current = switchEnvironment;
      own(() => {
        if (switchEnvironmentRef.current === switchEnvironment) switchEnvironmentRef.current = null;
      });
      await switchEnvironment(environmentKindRef.current);
      if (disposed) return;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      renderer.domElement.tabIndex = 0;
      renderer.domElement.setAttribute('aria-label', 'Material preview. Arrow keys pan the camera.');
      controls.listenToKeyEvents(renderer.domElement);
      own(() => controls.dispose());

      {
        setRenderProgress({ value: 90, label: 'Loading materials and textures…' });
        onLog?.('Parsing MaterialX document...');
        const manager = new THREE.LoadingManager();
        manager.onStart = () => {
          if (disposed || scope.disposed) return;
          report.resources = 'loading';
          publish();
        };
        manager.onLoad = () => {
          if (disposed || scope.disposed) return;
          report.resources = 'loaded';
          publish();
        };
        manager.onProgress = (url, loaded, total) => onLog?.(`Loading ${url}: ${loaded}/${total}`);
        manager.onError = (url) => {
          if (disposed || scope.disposed) return;
          if (!report.failedResources.includes(url)) report.failedResources.push(url);
          publish();
          onLog?.(`Failed to load resource: ${url}`);
        };

        const [{ data, fileName }, shaderBall] = await Promise.all([
          resolveSourceBytes(source, abort.signal),
          fetchBytes(shaderBallUrl),
        ]);
        if (disposed) return;

        const mtlxScene = await createMtlxScene(camera, controls, {
          data,
          fileName,
          shaderBall,
          manager,
          autoRotate: rotatingRef.current,
        });
        own(() => mtlxScene.dispose());
        if (disposed) return;
        scene.add(mtlxScene.root);
        mtlxSceneRef.current = mtlxScene;
        setMaterialNames(mtlxScene.materialNames);
        if (mtlxScene.materialNames.includes(settingsRef.current.materialName))
          mtlxScene.setMaterial(settingsRef.current.materialName);
        setActiveMaterial(mtlxScene.activeMaterial);
        mtlxScene.setGeometry(settingsRef.current.geometry);
        mtlxScene.autoRotate = rotatingRef.current;
        onLog?.(`Material applied (${mtlxScene.materialNames.length} available).`);
      }

      let frameId = 0;
      observeViewerResize(scope, container, renderer, camera);
      own(() => cancelAnimationFrame(frameId));

      let clock = performance.now();
      const animate = () => {
        const now = performance.now();
        mtlxSceneRef.current?.update((now - clock) / 1000);
        clock = now;
        controls.update();
        void rendering.render().catch((error: unknown) => {
          if (disposed || scope.disposed) return;
          cleanup();
          report.state = 'error';
          publish();
          mtlxSceneRef.current = null;
          onError(error instanceof Error ? error.message : String(error));
        });
        frameId = requestAnimationFrame(animate);
      };
      // A mounted canvas alone does not establish that shader compilation/rendering succeeded.
      setRenderProgress({ value: 95, label: 'Rendering preview…' });
      await rendering.render();
      if (disposed) return;
      setRenderProgress({ value: 100, label: 'Preview ready' });
      report.state = 'ready';
      publish();
      setLoading(false);
      animate();
    })().catch((error: unknown) => {
      cleanup();
      if (disposed) return;
      setLoading(false);
      report.state = 'error';
      publish();
      const message = error instanceof Error ? error.message : String(error);
      onLog?.(`ERROR: ${message}`);
      onError(message);
    });

    return () => {
      disposed = true;
      mtlxSceneRef.current = null;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- source is compared by identity intentionally
  }, [source]);

  const progress =
    loadProgress ??
    (source && (loading || previewState === 'idle' || previewState === 'loading') ? renderProgress : null);

  return (
    <div
      ref={frameRef}
      aria-busy={!!progress}
      data-preview-state={previewState}
      className="viewer-frame relative flex w-full flex-col sm:aspect-square overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-sm"
    >
      <MaterialSelect
        names={materialNames}
        value={activeMaterial}
        onChange={(name) => {
          setActiveMaterial(name);
          updateSettings({ materialName: name });
          mtlxSceneRef.current?.setMaterial(name);
        }}
      />
      <output className="sr-only">Preview: {previewState}</output>
      <div
        ref={containerRef}
        className="relative aspect-square w-full shrink-0 overflow-hidden sm:h-full [&>canvas]:absolute [&>canvas]:inset-0"
      />
      {materialNames.length ? (
        <ViewerSettingsPanel
          className="m-3 sm:absolute sm:right-3 sm:bottom-3 sm:left-3 sm:m-0"
          settings={currentSettings}
          onChange={updateSettings}
        />
      ) : null}
      <output
        className={
          environmentMessage ? 'absolute bottom-16 left-2 rounded bg-black/80 p-2 text-xs text-white' : 'sr-only'
        }
      >
        {environmentMessage}
      </output>
      {progress ? <MaterialLoadingOverlay progress={progress} /> : null}
      {!source && !progress ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/50">
          Drop a MaterialX file here, or choose a sample to get started.
        </div>
      ) : null}
    </div>
  );
}
