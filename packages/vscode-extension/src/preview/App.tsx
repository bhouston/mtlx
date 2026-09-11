import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  GEOMETRY_OPTIONS,
  IBL_OPTIONS,
  InfoPanel,
  LogPanel,
  MaterialSelect,
  ViewerSettingsPanel,
} from 'mtlx-viewer/react';
import { computeChecks, type CheckState } from 'mtlx-viewer/diagnostics';
import type { ViewerSettings } from 'mtlx-viewer/settings';
import { parsePreviewSettings } from '../previewSettings.js';
import type { PreviewAssetBytes } from '../previewAssets.js';
import type { PreviewPayload } from './protocol.js';
import { vscode, receiveAsset } from './host.js';
import { previewState, restorePreviewSettings, type PreviewState } from './state.js';
import { startPreviewScene, type PreviewScene } from './scene.js';
import { getDiagnostics, subscribeDiagnostics, resetDiagnostics, log } from './diagnostics.js';

type HostMessage = PreviewPayload | (PreviewAssetBytes & { type: 'asset'; requestId: number; error?: string });

/** ViewerSettings keys → persisted PreviewState keys (kept so saved previews survive upgrades). */
const STATE_KEYS: Record<keyof ViewerSettings, keyof PreviewState> = {
  ibl: 'environmentKind',
  geometry: 'geometry',
  rotate: 'rotating',
  bloom: 'bloom',
  ao: 'ao',
  toneMapping: 'toneMapping',
  exposure: 'exposure',
  intensity: 'environmentIntensity',
  materialName: 'material',
};
const CHECK_SYMBOL: Record<CheckState, string> = {
  passed: '✓',
  failed: '✗',
  warning: '⚠',
  pending: '…',
  unchecked: '–',
};

const statusClass = (text: string) =>
  text
    ? 'absolute bottom-16 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded bg-black/80 p-2 text-xs text-white'
    : 'sr-only';

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
  );
}

export function PreviewApp() {
  const [payload, setPayload] = useState<PreviewPayload>();
  const [ui, setUi] = useState<PreviewState>(() => ({ ...previewState }));
  const [scene, setScene] = useState<PreviewScene | null>(null);
  const sceneRef = useRef<PreviewScene | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const diagnostics = useSyncExternalStore(subscribeDiagnostics, getDiagnostics);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const loggedChecks = useRef('');
  const settings = useMemo(() => payload?.settings ?? parsePreviewSettings({}), [payload]);
  const persist = useCallback(() => {
    vscode?.setState(previewState);
    setUi({ ...previewState });
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>) => {
      if ('type' in event.data && event.data.type === 'asset') {
        receiveAsset(event.data);
        return;
      }
      const next = event.data as PreviewPayload;
      // Dispose first so the outgoing scene saves its camera before the settings are normalized
      // (a settings change discards the saved camera).
      sceneRef.current?.dispose();
      const parsed = next.settings ?? parsePreviewSettings({});
      restorePreviewSettings(parsed);
      resetDiagnostics(next.parseError);
      loggedChecks.current = '';
      for (const warning of parsed.warnings) log(`Settings: ${warning}`);
      setPayload({ ...next, settings: parsed });
      persist();
    };
    const onPageHide = () => sceneRef.current?.dispose();
    window.addEventListener('message', onMessage);
    window.addEventListener('pagehide', onPageHide);
    // Mirror VS Code's theme class so the shared `dark:` styles follow the editor theme.
    const syncTheme = () =>
      document.documentElement.classList.toggle(
        'dark',
        document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast'),
      );
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    log('Preview script loaded, waiting for document data...');
    // Register before requesting data, including when VS Code recreates a hidden webview.
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    vscode?.postMessage({ type: 'ready' });
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', onPageHide);
      observer.disconnect();
    };
  }, [persist]);

  useEffect(() => {
    document.body.dataset.previewState = diagnostics.report.state;
  }, [diagnostics.report.state]);

  useEffect(() => {
    if (!payload) return;
    const canvas = canvasRef.current;
    if (payload.parseError || !payload.data || !payload.shaderBall || !canvas) return;
    const next = startPreviewScene({
      canvas,
      data: payload.data,
      fileName: payload.fileName,
      textures: payload.textures,
      shaderBall: payload.shaderBall,
      settings,
      state: previewState,
      persist,
    });
    sceneRef.current = next;
    void next.ready.then(() => {
      if (!next.disposed && sceneRef.current === next) setScene(next);
    });
    return () => {
      setScene(null);
      if (sceneRef.current === next) sceneRef.current = null;
      next.dispose();
    };
  }, [payload, settings, persist]);

  const rotating = !!ui.rotating && !reducedMotion;
  useEffect(() => scene?.setRotating(rotating), [scene, rotating]);
  useEffect(() => {
    if (scene && ui.geometry) void scene.setGeometry(ui.geometry);
  }, [scene, ui.geometry]);
  useEffect(() => {
    if (scene && ui.environmentKind) void scene.setEnvironment(ui.environmentKind);
  }, [scene, ui.environmentKind]);
  useEffect(() => {
    if (scene && ui.material) scene.setMaterial(ui.material);
  }, [scene, ui.material]);
  useEffect(() => {
    scene?.applyRendering({
      bloom: ui.bloom ?? settings.bloom,
      ao: ui.ao ?? settings.ao,
      toneMapping: ui.toneMapping ?? settings.toneMapping,
      exposure: ui.exposure ?? 0,
      intensity: ui.environmentIntensity ?? 1,
    });
  }, [scene, settings, ui.bloom, ui.ao, ui.toneMapping, ui.exposure, ui.environmentIntensity]);

  const viewerError = payload?.parseError ? undefined : diagnostics.error;
  const checks = useMemo(
    () =>
      payload &&
      computeChecks({
        issues: payload.issues,
        parseError: payload.parseError,
        viewerError,
        preview: diagnostics.report,
        resourcesChecked: payload.resourcesChecked,
      }),
    [payload, viewerError, diagnostics.report],
  );
  // Mirror the validity report as plain text in the log so it can be selected and shared.
  useEffect(() => {
    if (!checks) return;
    const key = JSON.stringify(checks);
    if (key === loggedChecks.current) return;
    loggedChecks.current = key;
    log(`Validity Checks: ${checks.overall} (${CHECK_SYMBOL[checks.overall]})`);
    for (const check of checks.checks) {
      log(`  ${check.name}: ${check.state} (${CHECK_SYMBOL[check.state]})`);
      for (const message of check.messages) log(`    - ${message}`);
    }
  }, [checks]);

  const viewerSettings: ViewerSettings = {
    ibl: ui.environmentKind ?? settings.defaultIbl,
    geometry: ui.geometry ?? settings.defaultGeometry,
    rotate: !!ui.rotating,
    bloom: ui.bloom ?? settings.bloom,
    ao: ui.ao ?? settings.ao,
    toneMapping: ui.toneMapping ?? settings.toneMapping,
    exposure: ui.exposure ?? 0,
    intensity: ui.environmentIntensity ?? 1,
    materialName: ui.material ?? '',
  };
  const updateSettings = (patch: Partial<ViewerSettings>) => {
    for (const [key, value] of Object.entries(patch))
      (previewState as Record<string, unknown>)[STATE_KEYS[key as keyof ViewerSettings]] = value;
    persist();
  };
  const geometries = [
    ...GEOMETRY_OPTIONS,
    ...settings.geometries.map((asset) => ({ value: asset.name, label: asset.name })),
  ];
  const ibls = [...IBL_OPTIONS, ...settings.ibls.map((asset) => ({ value: asset.name, label: asset.name }))];
  const error = payload?.parseError ?? diagnostics.error;

  return (
    <div className="flex min-h-screen flex-col gap-3 p-3 md:h-screen md:overflow-hidden">
      <p className="shrink-0 text-xs text-muted-foreground">
        Part of the{' '}
        <a
          href="https://mtlx.ben3d.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-3"
        >
          Mtlx suite of web-focused MaterialX tools
        </a>
        .
      </p>
      {settings.warnings.length ? (
        <output id="settings-status" aria-live="polite" className="shrink-0 text-xs text-amber-600 dark:text-amber-400">
          {settings.warnings.join(' ')}
        </output>
      ) : null}
      <div className="grid min-w-0 gap-3 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <div
          className="viewer-frame relative aspect-square w-full min-w-0 overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-sm md:aspect-auto md:min-h-0"
          data-preview-state={diagnostics.report.state}
        >
          <canvas
            ref={canvasRef}
            id="viewport"
            tabIndex={0}
            aria-label="Material preview. Arrow keys pan."
            className="absolute inset-0 h-full w-full"
          />
          <MaterialSelect
            names={diagnostics.materials}
            value={viewerSettings.materialName}
            onChange={(name) => updateSettings({ materialName: name })}
          />
          {error ? (
            <div
              role="alert"
              className="absolute inset-x-3 top-3 z-10 rounded-lg bg-destructive/90 p-3 text-xs whitespace-pre-wrap text-white [overflow-wrap:anywhere]"
            >
              {error}
            </div>
          ) : null}
          <output id="geometry-status" aria-live="polite" className={statusClass(diagnostics.geometryStatus)}>
            {diagnostics.geometryStatus}
          </output>
          <output id="environment-status" aria-live="polite" className={statusClass(diagnostics.environmentStatus)}>
            {diagnostics.environmentStatus}
          </output>
          <ViewerSettingsPanel
            className="absolute right-3 bottom-3 left-3 z-10"
            settings={viewerSettings}
            onChange={updateSettings}
            geometries={geometries}
            ibls={ibls}
            rotating={rotating}
            rotateDisabled={diagnostics.report.state !== 'ready'}
          />
        </div>
        <aside id="material-details" className="min-w-0 md:min-h-0 md:overflow-auto">
          <InfoPanel
            fileName={payload?.fileName}
            fileSize={payload?.fileSize}
            summary={payload?.summary}
            issues={payload?.issues ?? []}
            parseError={payload?.parseError}
            viewerError={viewerError}
            preview={diagnostics.report}
            resourcesChecked={payload?.resourcesChecked}
          />
        </aside>
      </div>
      <LogPanel id="log" lines={diagnostics.lines} className="shrink-0" />
    </div>
  );
}
