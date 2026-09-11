import { analyzeInWorker } from '@/lib/analyze-in-worker';
import { materialByteLimit, readBoundedResponse } from '@/lib/material-bytes';
import { CleanupScope } from '@/lib/cleanup-scope';
import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three/webgpu';
import type { GeometryKind, MtlxScene } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

export type MaterialSource =
  | { kind: 'buffer'; data: ArrayBuffer; name: string }
  | { kind: 'url'; folderUrl: string; fileName: string };

export interface PreviewReport {
  state: 'idle' | 'loading' | 'ready' | 'error';
  resources: 'unchecked' | 'loading' | 'loaded';
  failedResources: string[];
}

export interface MaterialViewerProps {
  source: MaterialSource | null;
  onError: (message: string | null) => void;
  /** Diagnostics for the log panel — mirrors the VS Code extension's webview log. */
  onLog?: (message: string) => void;
  onStatus?: (report: PreviewReport) => void;
}

const GEOMETRY_OPTIONS: { value: GeometryKind; label: string }[] = [
  { value: 'totem', label: 'Totem' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'plane', label: 'Plane' },
];

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
  const result = await analyzeInWorker(data, source.fileName, signal);
  if (result.analysis.parseError) throw new Error(result.analysis.parseError);
  return { data: result.data, fileName: response.url || url };
}

// three.js 0.186's MaterialXLoader (via mtlx-viewer's createMtlxScene) natively understands
// .mtlx and .mtlx.zip (it sniffs the zip magic bytes / filename) and resolves textures
// embedded in the archive itself, so this component doesn't need any zip handling of its own.
export function MaterialViewer({ source, onError, onLog, onStatus }: MaterialViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [rotating, setRotating] = useState(false);
  const rotatingRef = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlMessage, setControlMessage] = useState('');
  const statusCallback = useRef(onStatus);
  statusCallback.current = onStatus;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      rotatingRef.current = !preference.matches;
      setRotating(!preference.matches);
      if (mtlxSceneRef.current) mtlxSceneRef.current.autoRotate = !preference.matches;
    };
    apply();
    preference.addEventListener('change', apply);
    const changed = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      preference.removeEventListener('change', apply);
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const mtlxSceneRef = useRef<MtlxScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [activeMaterial, setActiveMaterial] = useState('');
  const [geometry, setGeometry] = useState<GeometryKind>('totem');

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
    setLoading(true);
    onError(null);

    (async () => {
      const THREE: typeof ThreeNS = await import('three/webgpu');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const { createMtlxScene, parseStudioEnvironment } = await import('mtlx-viewer');
      if (disposed) return;

      const width = container.clientWidth || 512;
      const height = container.clientHeight || 512;

      onLog?.('Creating WebGPURenderer...');
      const renderer = new THREE.WebGPURenderer({ antialias: true });
      own(() => {
        renderer.dispose();
        renderer.domElement.remove();
      });
      // Leave updateStyle at its default (true) — this also sets the canvas's CSS size to
      // width/height, not just its pixel buffer. With `false` the canvas kept its devicePixelRatio-
      // scaled buffer size as its CSS size too, rendering ~2x too big and getting cropped by the
      // container's overflow-hidden to just the top-left corner.
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      await renderer.init();
      if (disposed) return;
      const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
      onLog?.(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);
      container.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);

      // Shared studio IBL (packages/viewer), baked once from RoomEnvironment, so the website and
      // VS Code preview render the same lighting.
      onLog?.('Loading studio environment...');
      const envBytes = await fetchBytes(studioEnvironmentUrl);
      if (disposed) return;
      const studioTexture = await parseStudioEnvironment(envBytes);
      own(() => studioTexture.dispose());
      if (disposed) return;
      // @types/three lags three's addon source: fromEquirectangular() isn't in its
      // PMREMGenerator typings yet.
      const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
        fromEquirectangular: (texture: ThreeNS.Texture) => { texture: ThreeNS.Texture; dispose(): void };
        dispose(): void;
      };
      own(() => pmremGenerator.dispose());
      const environmentTarget = pmremGenerator.fromEquirectangular(studioTexture);
      own(() => environmentTarget.dispose());
      const environment = environmentTarget.texture;
      scene.environment = environment;
      scene.background = environment;
      onLog?.('Environment ready.');

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      renderer.domElement.tabIndex = 0;
      renderer.domElement.setAttribute(
        'aria-label',
        'Material preview. Arrow keys pan the camera; use Reset to restore the view.',
      );
      controls.listenToKeyEvents(renderer.domElement);
      own(() => controls.dispose());

      {
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
        setActiveMaterial(mtlxScene.activeMaterial);
        setGeometry(mtlxScene.geometry);
        onLog?.(`Material applied (${mtlxScene.materialNames.length} available).`);
      }

      let frameId = 0;
      const resize = () => {
        const w = container.clientWidth || 512;
        const h = container.clientHeight || 512;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      own(() => resizeObserver.disconnect());
      own(() => cancelAnimationFrame(frameId));

      let clock = performance.now();
      const animate = () => {
        const now = performance.now();
        mtlxSceneRef.current?.update((now - clock) / 1000);
        clock = now;
        controls.update();
        void renderer.renderAsync(scene, camera).catch((error: unknown) => {
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
      await renderer.renderAsync(scene, camera);
      if (disposed) return;
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

  return (
    <div
      ref={frameRef}
      data-preview-state={previewState}
      className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-black"
    >
      {materialNames.length > 0 ? (
        <div className="absolute top-2 right-2 left-2 z-10 flex flex-wrap gap-2 [&>button]:rounded [&>button]:border [&>button]:border-white/20 [&>button]:bg-black/70 [&>button]:px-2 [&>button]:py-1 [&>button]:text-xs [&>button]:text-white">
          <select
            className="rounded border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
            aria-label="Material"
            style={{ minWidth: 0, maxWidth: '100%' }}
            value={activeMaterial}
            onChange={(event) => {
              setActiveMaterial(event.target.value);
              mtlxSceneRef.current?.setMaterial(event.target.value);
            }}
          >
            {materialNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
            aria-label="Geometry"
            value={geometry}
            onChange={(event) => {
              const kind = event.target.value as GeometryKind;
              setGeometry(kind);
              mtlxSceneRef.current?.setGeometry(kind);
            }}
          >
            {GEOMETRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-pressed={!rotating}
            onClick={() => {
              rotatingRef.current = !rotating;
              setRotating(!rotating);
              if (mtlxSceneRef.current) mtlxSceneRef.current.autoRotate = !rotating;
            }}
          >
            {rotating ? 'Pause rotation' : 'Resume rotation'}
          </button>
          <button type="button" onClick={() => mtlxSceneRef.current?.resetCamera()}>
            Reset
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                if (document.fullscreenElement === frameRef.current) await document.exitFullscreen();
                else await frameRef.current?.requestFullscreen();
                setControlMessage('');
              } catch {
                setControlMessage('Fullscreen is unavailable in this browser or embed.');
              }
            }}
          >
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        </div>
      ) : null}
      <output className={controlMessage ? 'absolute bottom-2 z-10 bg-black/80 p-2 text-sm text-white' : 'sr-only'}>
        {controlMessage || `Preview: ${previewState}`}
      </output>
      <div ref={containerRef} className="h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Loading…</div>
      ) : null}
      {!source ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/50">
          Drag & drop a .mtlx or .mtlx.zip file anywhere here, or pick a sample above
        </div>
      ) : null}
    </div>
  );
}
