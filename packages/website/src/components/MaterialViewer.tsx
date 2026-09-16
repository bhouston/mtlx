import { DEFAULT_VIEWER_SETTINGS, type ViewerSettings } from '@/lib/viewer-search';
import type { AnimationMode } from 'mtlx-viewer/settings';
import { MaterialLoadingOverlay } from './MaterialLoadingOverlay';
import type { MaterialLoadProgress } from '@/lib/material-load';
import { useEffect, useRef, useState } from 'react';
import { Cache } from 'three';
import { AnimationToggle, MaterialSelect, ViewerSettingsPanel } from 'mtlx-viewer/react';
import type { Viewer } from 'mtlx-viewer';
import type { PreviewReport } from 'mtlx-viewer/diagnostics';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';
import bridgeEnvironmentUrl from 'mtlx-viewer/assets/default-environment.hdr?url';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

export type { PreviewReport } from 'mtlx-viewer/diagnostics';

export interface MaterialSource {
  data: ArrayBuffer;
  name: string;
}

export interface MaterialViewerProps {
  source: MaterialSource | null;
  /**
   * Files the document references by archive-relative path, served to the loader as blob: URLs
   * that stay stable while this array does, so an edited document reuses its decoded textures.
   */
  resources?: readonly { archivePath: string; data: Uint8Array }[];
  settings?: ViewerSettings;
  onSettingsChange?: (patch: Partial<ViewerSettings>) => void;
  /** Play/pause for `<time>`/`<frame>` materials: `false` hides the button; defaults to playing. */
  animationMode?: AnimationMode;
  loadProgress?: MaterialLoadProgress | null;
  onError: (message: string | null) => void;
  /** Diagnostics for the log panel — mirrors the VS Code extension's webview log. */
  onLog?: (message: string) => void;
  onStatus?: (report: PreviewReport) => void;
}

const ENVIRONMENT_URLS: Record<string, string> = { studio: studioEnvironmentUrl, bridge: bridgeEnvironmentUrl };
const STAGE_PROGRESS = {
  renderer: { value: 80, label: 'Preparing preview…' },
  environment: { value: 85, label: 'Loading lighting…' },
  material: { value: 90, label: 'Loading materials and textures…' },
  render: { value: 95, label: 'Rendering preview…' },
  ready: { value: 100, label: 'Preview ready' },
} as const;

async function fetchBytes(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  return response.arrayBuffer();
}

/** The loader asks for the document's directory plus the reference; both forms name an archive path. */
function resolveResource(urls: Map<string, string>, url: string): string | undefined {
  const base = 'https://mtlx.invalid/';
  return urls.get(url) ?? urls.get(decodeURI(new URL(url, base).href.slice(base.length)));
}

// three.js 0.186's MaterialXLoader (via mtlx-viewer) natively understands .mtlx and .mtlx.zip and
// resolves textures embedded in the archive itself, so this component needs no zip handling.
export function MaterialViewer({
  source,
  resources,
  loadProgress,
  onError,
  onLog,
  onStatus,
  settings,
  onSettingsChange,
  animationMode,
}: MaterialViewerProps) {
  const [localSettings, setLocalSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);
  const currentSettings = settings ?? localSettings;
  const updateSettings = (patch: Partial<ViewerSettings>) => {
    if (onSettingsChange) onSettingsChange(patch);
    else setLocalSettings((current) => ({ ...current, ...patch }));
  };
  // The viewer outlives the material. The first source builds it (renderer, environment, post
  // pipeline, controls, shader ball); every later source is compiled into the running viewer, so
  // the camera and the previous material stay on screen while the new one compiles.
  interface Run {
    /** What the viewer shows or is loading; a newer `source` prop reads as loading until applied. */
    source: MaterialSource | null;
    state: PreviewReport['state'];
    stage: keyof typeof STAGE_PROGRESS;
    environment: string;
    viewer: Viewer | null;
  }
  const [run, setRun] = useState<Run>({
    source: null,
    state: 'idle',
    stage: 'renderer',
    environment: '',
    viewer: null,
  });
  const viewer = source ? run.viewer : null;
  const previewState = run.source === source ? run.state : source ? 'loading' : 'idle';
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  // Identifies the viewer being built or shown, so callbacks from a superseded build never show through.
  const owner = useRef<object | null>(null);
  // Callbacks and the initial settings are read from a ref so a new source never rebuilds the viewer.
  const callbacks = useRef({ onError, onLog, onStatus, settings: currentSettings, animationMode });
  useEffect(() => {
    callbacks.current = { onError, onLog, onStatus, settings: currentSettings, animationMode };
  });
  useEffect(
    () => () => {
      owner.current = null;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    },
    [],
  );
  const resourceUrls = useRef(new Map<string, string>());
  useEffect(() => {
    if (!resources?.length) return;
    const urls = new Map(
      resources.map((r) => [r.archivePath, URL.createObjectURL(new Blob([new Uint8Array(r.data)]))]),
    );
    resourceUrls.current = urls;
    // three decodes each image URL once while its cache is on; the entries leave with their URLs.
    Cache.enabled = true;
    return () => {
      resourceUrls.current = new Map();
      for (const url of urls.values()) {
        URL.revokeObjectURL(url);
        Cache.remove(url);
        Cache.remove(`image-bitmap:${url}`);
      }
      Cache.enabled = false;
    };
  }, [resources]);

  useEffect(() => {
    const container = containerRef.current;
    const idle: PreviewReport = { state: source ? 'loading' : 'idle', resources: 'unchecked', failedResources: [] };
    callbacks.current.onStatus?.(idle);
    if (!container || !source) {
      owner.current = null;
      viewerRef.current?.dispose();
      viewerRef.current = null;
      return;
    }
    callbacks.current.onError(null);
    const live = viewerRef.current && !viewerRef.current.disposed ? viewerRef.current : null;
    const token = live ? owner.current! : {};
    owner.current = token;
    const patch = (fields: Partial<Run>) => owner.current === token && setRun((current) => ({ ...current, ...fields }));
    const fail = (error: unknown) => {
      if (owner.current !== token) return;
      const text = error instanceof Error ? error.message : String(error);
      patch({ state: 'error' });
      callbacks.current.onStatus?.({ state: 'error', resources: 'unchecked', failedResources: [] });
      callbacks.current.onLog?.(`ERROR: ${text}`);
      callbacks.current.onError(text);
    };
    if (live) {
      // Compiling is synchronous; yield once so the loading state paints first.
      const timer = setTimeout(() => {
        patch({ source });
        try {
          live.replaceMaterial(source.data, source.name);
        } catch (error) {
          fail(error);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    const abort = new AbortController();
    let created: Viewer | undefined;
    patch({ source, state: 'loading', stage: 'renderer', environment: '', viewer: null });
    (async () => {
      const { createViewer, parseEnvironmentFile } = await import('mtlx-viewer');
      const shaderBall = await fetchBytes(shaderBallUrl, abort.signal);
      abort.signal.throwIfAborted();
      created = await createViewer({
        signal: abort.signal,
        container,
        data: source.data,
        fileName: source.name,
        shaderBall,
        settings: callbacks.current.settings,
        playing: callbacks.current.animationMode !== 'pause',
        resolveUrl: (url) => resolveResource(resourceUrls.current, url),
        loadEnvironment: async (kind) => {
          const url = ENVIRONMENT_URLS[kind] ?? ENVIRONMENT_URLS.studio!;
          return parseEnvironmentFile(await fetchBytes(url, abort.signal), url);
        },
        onLog: (line) => {
          if (owner.current === token) callbacks.current.onLog?.(line);
        },
        onStage: (stage) => patch({ stage }),
        onStatus: (status) => {
          if (status.environment !== undefined) patch({ environment: status.environment });
        },
        onReport: (report) => {
          if (owner.current !== token) return;
          patch({ state: report.state });
          callbacks.current.onStatus?.(report);
        },
        onError: (text) => {
          if (owner.current !== token) return;
          viewerRef.current = null;
          patch({ viewer: null });
          callbacks.current.onError(text);
        },
      });
      if (owner.current !== token) created.dispose();
      else {
        viewerRef.current = created;
        patch({ viewer: created });
      }
    })().catch(fail);
    return () => {
      // A source that arrives mid-build restarts the build; a finished viewer is kept for reuse.
      if (created) return;
      if (owner.current === token) owner.current = null;
      abort.abort();
    };
  }, [source]);

  const { ibl, geometry, rotate, bloom, ao, toneMapping, background, exposure, intensity, materialName } =
    currentSettings;
  useEffect(() => {
    void viewer?.setSettings({
      ibl,
      geometry,
      rotate,
      bloom,
      ao,
      toneMapping,
      background,
      exposure,
      intensity,
      materialName,
    });
  }, [viewer, ibl, geometry, rotate, bloom, ao, toneMapping, background, exposure, intensity, materialName]);

  const loading = !!source && previewState !== 'ready' && previewState !== 'error';
  const progress = loadProgress ?? (loading ? STAGE_PROGRESS[run.stage] : null);
  const environmentMessage = run.environment;
  const materialNames = viewer?.scene.materialNames ?? [];

  return (
    <div
      aria-busy={!!progress}
      data-preview-state={previewState}
      className="viewer-frame relative flex w-full flex-col sm:aspect-square overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-sm"
    >
      <MaterialSelect
        names={materialNames}
        value={materialNames.includes(materialName) ? materialName : (viewer?.scene.activeMaterial ?? '')}
        onChange={(name) => updateSettings({ materialName: name })}
      />
      <AnimationToggle viewer={viewer} mode={animationMode} />
      <output className="sr-only">Preview: {previewState}</output>
      <div
        ref={containerRef}
        className="relative aspect-square w-full shrink-0 overflow-hidden sm:h-full [&>canvas]:absolute [&>canvas]:inset-0"
      />
      {viewer ? (
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
      {progress && (!viewer || loadProgress) ? <MaterialLoadingOverlay progress={progress} /> : null}
      {progress && viewer && !loadProgress ? (
        <output className="absolute top-2 left-2 z-20 rounded bg-black/80 px-2 py-1 text-xs text-white">
          {progress.label}
        </output>
      ) : null}
      {!source && !progress ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/50">
          Drop a MaterialX file here, or choose a sample to get started.
        </div>
      ) : null}
    </div>
  );
}
