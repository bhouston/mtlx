/**
 * Webview preview script — receives the raw file bytes + host-computed stats from the
 * extension and renders a three.js 3D preview plus a stats/validation panel. Bundled with
 * esbuild (including three.js) the same way hdrify bundles its tonemapper into preview.js.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createMtlxScene,
  createViewerRendering,
  TONE_MAPPING_OPTIONS,
  type RenderingSettings,
  parseEnvironment,
  createEnvironmentSwitcher,
  parseEnvironmentFile,
  type GeometryKind,
  type MtlxScene,
} from 'mtlx-viewer';
// esbuild's dataurl loader (see build-preview.js) inlines this as a base64 data: URL string.
import { parsePreviewSettings, type PreviewSettings } from '../previewSettings.js';
import type { PreviewAssetBytes } from '../previewAssets.js';
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

interface PreviewState extends Partial<RenderingSettings> {
  material?: string;
  geometry?: GeometryKind;
  rotating?: boolean;
  exposure?: number;
  environmentIntensity?: number;
  environmentKind?: string;
  settingsKey?: string;
  camera?: { position: number[]; target: number[]; zoom: number; rotation: number[] };
}
declare const acquireVsCodeApi:
  | (() => {
      postMessage(message: unknown): void;
      getState(): PreviewState | undefined;
      setState(state: PreviewState): void;
    })
  | undefined;
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
const previewState = vscode?.getState() ?? {};
let disposeCurrent = () => {};
let payloadGeneration = 0;
window.addEventListener('pagehide', () => disposeCurrent());

interface MaterialInfo {
  name?: string;
  category: string;
}

interface MaterialXSummary {
  version?: string;
  colorspace?: string;
  nodeGraphCount: number;
  topLevelNodeCount: number;
  nodeCategories: string[];
  materials: MaterialInfo[];
  referencedTextures: string[];
  nodes: MaterialInfo[];
}

interface ValidationIssue {
  level: 'error' | 'warning';
  rule?: string;
  code?: string;
  location: string;
  message: string;
}

interface PreviewTexture {
  path: string;
  data: ArrayBuffer;
}

interface PreviewPayload {
  settings?: PreviewSettings;
  fileName: string;
  fileSize: number;
  valid: boolean;
  issues: ValidationIssue[];
  summary?: MaterialXSummary;
  parseError?: string;
  data?: ArrayBuffer;
  textures: PreviewTexture[];
  shaderBall?: ArrayBuffer;
  resourcesChecked?: boolean;
  resourcePaths?: string[];
}

let nextAssetRequest = 0;
const pendingAssets = new Map<
  number,
  { resolve: (asset: PreviewAssetBytes) => void; reject: (error: Error) => void }
>();
function requestAsset(kind: 'ibl' | 'geometry', name: string, signal: AbortSignal): Promise<PreviewAssetBytes> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const requestId = ++nextAssetRequest;
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      pendingAssets.delete(requestId);
    };
    const abort = () => {
      finish();
      reject(new Error('Asset request cancelled'));
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error('Asset request timed out'));
    }, 120_000);
    signal.addEventListener('abort', abort, { once: true });
    pendingAssets.set(requestId, {
      resolve: (asset) => {
        finish();
        resolve(asset);
      },
      reject: (error) => {
        finish();
        reject(error);
      },
    });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    vscode?.postMessage({ type: 'loadAsset', requestId, kind, name });
  });
}

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const logEl = document.getElementById('log') as HTMLDivElement;
const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;
const rotationEl = document.getElementById('rotation') as HTMLInputElement;
const resetEl = document.getElementById('reset') as HTMLButtonElement;
let lastPayload: PreviewPayload | undefined;
let failedResources: string[] = [];
type PreviewStatus = 'loading' | 'ready' | 'failed' | undefined;
let previewStatus: PreviewStatus;
function setPreviewStatus(value: PreviewStatus): void {
  previewStatus = value;
  if (lastPayload) renderStats(lastPayload);
}

// Diagnostics console: every step of renderer/loader setup is logged here (visible in the
// webview itself, no devtools needed) and mirrored to the extension host's Output channel via
// postMessage, since a rejected promise or thrown error in a webview otherwise vanishes with no
// trace — exactly what produced the "stuck progress bar, black canvas, no error" symptom.
function log(message: string): void {
  console.log(`[mtlx-preview] ${message}`);
  const line = document.createElement('div');
  line.textContent = message;
  logEl.append(line);
  logEl.scrollTop = logEl.scrollHeight;
  // VS Code Webview.postMessage has no targetOrigin
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  vscode?.postMessage({ type: 'log', message });
}

function showError(message: string): void {
  log(`ERROR: ${message}`);
  setPreviewStatus('failed');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

window.addEventListener('error', (event) => {
  showError(`Uncaught error: ${event.message}`);
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  showError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderSection(title: string, items: string[], expanded = false, count = items.length): string {
  return `<details ${expanded ? 'open' : ''}>
    <summary>${escapeHtml(title)} (${count})</summary>
    <ul>${items.length ? items.map((item) => `<li>${item}</li>`).join('') : '<li class="none">(none)</li>'}</ul>
  </details>`;
}

type CheckState = 'passed' | 'failed' | 'warning' | 'pending' | 'unchecked';
const CHECK_SYMBOL: Record<CheckState, string> = {
  passed: '✓',
  failed: '✗',
  warning: '⚠',
  pending: '…',
  unchecked: '–',
};

interface Check {
  name: string;
  state: CheckState;
  messages: string[];
}

function computeChecks(payload: PreviewPayload): { checks: Check[]; overall: CheckState } {
  const checks: Check[] = [
    {
      name: 'XML',
      state: payload.parseError ? 'failed' : 'passed',
      messages: payload.parseError ? [payload.parseError] : [],
    },
  ];
  const groups: [string, string][] = [
    ['basic', 'Nodes'],
    ['structure', 'Structure'],
    ['types', 'Types'],
    ['resources', 'Dependencies'],
    ['renderer-support', 'Renderer support'],
  ];
  for (const [rule, name] of groups) {
    const findings = payload.issues.filter((issue) => issue.rule === rule);
    const messages = findings.map((issue) => `${issue.location}: ${issue.message}`);
    let state: CheckState = payload.parseError ? 'unchecked' : 'passed';
    if (rule === 'resources' && !payload.parseError) {
      state = previewStatus === 'loading' ? 'pending' : payload.resourcesChecked ? 'passed' : 'unchecked';
      if (!payload.resourcesChecked) messages.push('Dependencies could not be checked.');
      if (failedResources.length) {
        state = 'failed';
        messages.push(...failedResources.map((url) => `Failed to load: ${url}`));
      }
    }
    if (findings.some((issue) => issue.level === 'error')) state = 'failed';
    else if (findings.length && state !== 'failed') state = 'warning';
    checks.push({ name, state, messages });
  }
  const remaining = payload.issues.filter(
    (issue) => issue.code !== 'PARSE_ERROR' && !groups.some(([rule]) => rule === issue.rule),
  );
  if (remaining.length)
    checks.push({
      name: 'Document',
      state: remaining.some((issue) => issue.level === 'error') ? 'failed' : 'warning',
      messages: remaining.map((issue) => `${issue.location}: ${issue.message}`),
    });
  checks.push({
    name: 'Preview',
    state:
      previewStatus === 'failed'
        ? 'failed'
        : payload.parseError
          ? 'unchecked'
          : previewStatus === 'ready'
            ? 'passed'
            : previewStatus === 'loading'
              ? 'pending'
              : 'unchecked',
    messages: [],
  });
  const overall =
    (['failed', 'warning', 'pending', 'unchecked'] as const).find((candidate) =>
      checks.some((check) => check.state === candidate),
    ) ?? 'passed';
  return { checks, overall };
}

function renderValidityChecks(checks: Check[], overall: CheckState): string {
  const open = checks.some((check) => check.state === 'failed' || check.state === 'warning');
  return `<details ${open ? 'open' : ''}>
    <summary>Validity Checks <span class="check-${overall}">${CHECK_SYMBOL[overall]}</span></summary>
    <ul>${checks
      .map(
        (check) => `<li>
        <div class="check-row"><span>${escapeHtml(check.name)}</span><span class="check-${check.state}">${CHECK_SYMBOL[check.state]}</span></div>
        ${check.messages.length ? `<ul class="check-messages">${check.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>` : ''}
      </li>`,
      )
      .join('')}</ul>
  </details>`;
}

// Mirrors renderValidityChecks as plain text in the log panel, so the whole validity report can
// be selected and shared without leaving the webview. Only logged when the checks actually
// change, since renderStats re-runs on every preview status transition.
let lastLoggedChecks = '';
function logValidityChecks(checks: Check[], overall: CheckState): void {
  const key = JSON.stringify({ checks, overall });
  if (key === lastLoggedChecks) return;
  lastLoggedChecks = key;
  log(`Validity Checks: ${overall} (${CHECK_SYMBOL[overall]})`);
  for (const check of checks) {
    log(`  ${check.name}: ${check.state} (${CHECK_SYMBOL[check.state]})`);
    for (const message of check.messages) log(`    - ${message}`);
  }
}

function renderStats(payload: PreviewPayload): void {
  const summary = payload.summary;
  const fileDetailsHtml = `<details open>
    <summary>File details</summary>
    <dl>
      <dt>Size</dt><dd>${formatFileSize(payload.fileSize)}</dd>
      ${
        summary
          ? `<dt>Version</dt><dd>${escapeHtml(summary.version ?? 'unknown')}</dd>
      <dt>Colorspace</dt><dd>${escapeHtml(summary.colorspace ?? 'unknown')}</dd>
      <dt>Node graphs</dt><dd>${summary.nodeGraphCount}</dd>
      <dt>Top-level nodes</dt><dd>${summary.topLevelNodeCount}</dd>`
          : ''
      }
    </dl>
  </details>`;

  let summaryHtml = '';
  if (summary) {
    const materialCategories = new Set(summary.materials.map((material) => material.category));
    const nodeTypeCounts = new Map<string, number>();
    for (const node of summary.nodes) {
      if (
        materialCategories.has(node.category) ||
        ['surfacematerial', 'volumematerial'].includes(node.category.toLowerCase())
      )
        continue;
      nodeTypeCounts.set(node.category, (nodeTypeCounts.get(node.category) ?? 0) + 1);
    }
    const internalNodeCount = [...nodeTypeCounts.values()].reduce((total, count) => total + count, 0);
    summaryHtml =
      renderSection(
        'Materials',
        summary.materials.map((m) => `${escapeHtml(m.name ?? '(unnamed)')} [${escapeHtml(m.category)}]`),
        summary.materials.length > 1,
      ) +
      renderSection(
        'References',
        summary.referencedTextures.map((t) => escapeHtml(t)),
      ) +
      renderSection(
        'Internal Nodes',
        [...nodeTypeCounts]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([type, count]) => `${escapeHtml(type)} (${count})`),
        false,
        internalNodeCount,
      );
  }

  const { checks, overall } = computeChecks(payload);
  statsEl.innerHTML = fileDetailsHtml + summaryHtml + renderValidityChecks(checks, overall);
  logValidityChecks(checks, overall);
}

function populateMaterialSelect(scene: MtlxScene): void {
  materialSelectEl.innerHTML = scene.materialNames
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join('');
  materialSelectEl.value = scene.activeMaterial;
  materialSelectEl.disabled = scene.materialNames.length <= 1;
}

async function renderScene(
  data: ArrayBuffer,
  fileName: string,
  textures: PreviewTexture[],
  shaderBall: ArrayBuffer,
  settings: PreviewSettings,
): Promise<void> {
  disposeCurrent();
  let disposed = false;
  const disposers: (() => void)[] = [];
  const own = (dispose: () => void) => {
    if (disposed) dispose();
    else disposers.push(dispose);
  };
  disposeCurrent = () => {
    disposed = true;
    while (disposers.length) disposers.pop()?.();
  };
  errorEl.style.display = 'none';
  setPreviewStatus('loading');
  rotationEl.disabled = true;
  resetEl.disabled = true;
  const width = canvasEl.clientWidth || 512;
  const height = canvasEl.clientHeight || 512;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);

  log('Creating WebGPURenderer...');
  const renderer = new THREE.WebGPURenderer({ canvas: canvasEl, antialias: true });
  own(() => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  await renderer.init();
  if (disposed) return;
  const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
  log(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);

  const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
    fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
    dispose(): void;
  };
  own(() => pmremGenerator.dispose());
  const environmentAbort = new AbortController();
  own(() => environmentAbort.abort());
  const environments = createEnvironmentSwitcher(
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
      scene.environment = texture;
      scene.background = texture;
    },
  );
  own(() => environments.dispose());
  const environmentSelect = document.getElementById('environment-select') as HTMLSelectElement;
  environmentSelect.replaceChildren(
    ...[
      { name: 'bridge', label: 'San Giuseppe Bridge' },
      { name: 'studio', label: 'Studio' },
      ...settings.ibls.map((asset) => ({ name: asset.name, label: asset.name })),
    ].map((entry) => new Option(entry.label, entry.name)),
  );
  environmentSelect.value = previewState.environmentKind ?? settings.defaultIbl;
  const environmentStatus = document.getElementById('environment-status') as HTMLOutputElement;
  const changeEnvironment = async (): Promise<void> => {
    const kind = environmentSelect.value;
    previewState.environmentKind = kind;
    vscode?.setState(previewState);
    environmentStatus.textContent = 'Loading environment…';
    try {
      if (await environments.set(kind)) {
        environmentStatus.textContent = '';
        log(`Environment ready: ${kind === 'studio' ? 'Studio' : kind === 'bridge' ? 'San Giuseppe Bridge' : kind}.`);
      }
    } catch (error) {
      if (disposed || kind !== previewState.environmentKind) return;
      environmentStatus.textContent = `Environment failed to load: ${error instanceof Error ? error.message : String(error)}`;
      log(environmentStatus.textContent);
      if (!scene.environment && kind !== 'studio') {
        environmentSelect.value = kind === 'bridge' ? 'studio' : 'bridge';
        log(`Using fallback IBL: ${environmentSelect.value}.`);
        await changeEnvironment();
      }
    }
  };
  environmentSelect.addEventListener('change', changeEnvironment);
  own(() => environmentSelect.removeEventListener('change', changeEnvironment));
  await changeEnvironment();
  if (disposed) return;

  const rendering = createViewerRendering(renderer, scene, camera, {
    bloom: previewState.bloom ?? settings.bloom,
    ao: previewState.ao ?? settings.ao,
    toneMapping: previewState.toneMapping ?? settings.toneMapping,
  });
  own(() => rendering.dispose());
  const bloomEl = document.getElementById('bloom') as HTMLInputElement;
  const aoEl = document.getElementById('ao') as HTMLInputElement;
  const toneMappingEl = document.getElementById('tone-mapping') as HTMLSelectElement;
  toneMappingEl.replaceChildren(...TONE_MAPPING_OPTIONS.map(({ value, label }) => new Option(label, value)));
  bloomEl.checked = previewState.bloom ?? settings.bloom;
  aoEl.checked = previewState.ao ?? settings.ao;
  toneMappingEl.value = previewState.toneMapping ?? settings.toneMapping;
  const applyRendering = () => {
    previewState.bloom = bloomEl.checked;
    previewState.ao = aoEl.checked;
    previewState.toneMapping = toneMappingEl.value as RenderingSettings['toneMapping'];
    rendering.configure({ bloom: previewState.bloom, ao: previewState.ao, toneMapping: previewState.toneMapping });
    vscode?.setState(previewState);
  };
  for (const element of [bloomEl, aoEl, toneMappingEl]) {
    element.addEventListener('change', applyRendering);
    own(() => element.removeEventListener('change', applyRendering));
  }
  const exposureEl = document.getElementById('exposure') as HTMLInputElement;
  const environmentEl = document.getElementById('environment') as HTMLInputElement;
  exposureEl.value = String(previewState.exposure ?? 0);
  environmentEl.value = String(previewState.environmentIntensity ?? 1);
  const applyLighting = () => {
    previewState.exposure = Number(exposureEl.value);
    previewState.environmentIntensity = Number(environmentEl.value);
    renderer.toneMappingExposure = 2 ** previewState.exposure;
    scene.environmentIntensity = previewState.environmentIntensity;
    vscode?.setState(previewState);
  };
  applyLighting();
  exposureEl.addEventListener('input', applyLighting);
  environmentEl.addEventListener('input', applyLighting);
  own(() => {
    exposureEl.removeEventListener('input', applyLighting);
    environmentEl.removeEventListener('input', applyLighting);
  });
  const controls = new OrbitControls(camera, renderer.domElement);
  own(() => controls.dispose());
  controls.enableDamping = true;
  controls.listenToKeyEvents(canvasEl);

  const resize = () => {
    const w = canvasEl.clientWidth || 512;
    const h = canvasEl.clientHeight || 512;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const observer = new ResizeObserver(resize);
  own(() => observer.disconnect());
  observer.observe(canvasEl);

  let clock = performance.now();
  let mtlxScene: MtlxScene | undefined;
  let geometryGeneration = 0;
  const geometryLoads = new Map<string, Promise<void>>();
  const loadGeometry = async (name: string) => {
    if (!settings.geometries.some((asset) => asset.name === name)) return;
    if (!geometryLoads.has(name))
      geometryLoads.set(
        name,
        (async () => {
          const asset = await requestAsset('geometry', name, environmentAbort.signal);
          if (disposed) return;
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
      if (disposed) return;
      if (!failedResources.includes(url)) failedResources.push(url);
      if (lastPayload) renderStats(lastPayload);
      log(`Failed to load resource: ${url}`);
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
    if (disposed) return;
    if (previewState.material && mtlxScene.materialNames.includes(previewState.material))
      mtlxScene.setMaterial(previewState.material);
    const initialGeometry = previewState.geometry ?? settings.defaultGeometry;
    try {
      await loadGeometry(initialGeometry);
    } catch (error) {
      if (disposed) return;
      log(`Geometry ${initialGeometry}: ${error instanceof Error ? error.message : String(error)}. Using totem.`);
      delete previewState.camera;
    }
    if (disposed) return;
    mtlxScene.setGeometry(initialGeometry);
    previewState.geometry = mtlxScene.geometry;
    geometrySelectEl.value = mtlxScene.geometry;
    scene.add(mtlxScene.root);
    populateMaterialSelect(mtlxScene);
    log(`Material applied (${mtlxScene.materialNames.length} available).`);
  } catch (error) {
    if (disposed) return;
    disposeCurrent();
    showError(`MaterialX parse error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateRotation = () => {
    rotationEl.checked = mtlxScene?.autoRotate ?? false;
  };
  const motionChanged = () => {
    if (mtlxScene) mtlxScene.autoRotate = !preference.matches && (previewState.rotating ?? settings.autoRotate);
    updateRotation();
  };
  motionChanged();
  preference.addEventListener('change', motionChanged);
  own(() => preference.removeEventListener('change', motionChanged));
  const saved = previewState.camera;
  if (saved && mtlxScene) {
    camera.position.fromArray(saved.position);
    camera.zoom = saved.zoom;
    camera.updateProjectionMatrix();
    controls.target.fromArray(saved.target);
    mtlxScene.root.children
      .find((child) => child.visible)
      ?.rotation.set(saved.rotation[0]!, saved.rotation[1]!, saved.rotation[2]!);
    controls.update();
  }
  const saveCamera = () => {
    const object = mtlxScene?.root.children.find((child) => child.visible);
    previewState.camera = {
      position: camera.position.toArray(),
      target: controls.target.toArray(),
      zoom: camera.zoom,
      rotation: object ? [object.rotation.x, object.rotation.y, object.rotation.z] : [0, 0, 0],
    };
    vscode?.setState(previewState);
  };
  controls.addEventListener('end', saveCamera);
  own(() => {
    saveCamera();
    controls.removeEventListener('end', saveCamera);
  });
  const toggleRotation = () => {
    if (mtlxScene) mtlxScene.autoRotate = rotationEl.checked;
    previewState.rotating = mtlxScene?.autoRotate;
    saveCamera();
  };
  const reset = () => {
    mtlxScene?.resetCamera();
    saveCamera();
  };
  rotationEl.addEventListener('change', toggleRotation);
  resetEl.addEventListener('click', reset);
  own(() => {
    rotationEl.removeEventListener('change', toggleRotation);
    resetEl.removeEventListener('click', reset);
  });
  await rendering.render();
  if (disposed) return;
  rotationEl.disabled = false;
  resetEl.disabled = false;
  setPreviewStatus('ready');
  clock = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const deltaSeconds = (now - clock) / 1000;
    clock = now;
    mtlxScene?.update(deltaSeconds);
    controls.update();
    void rendering.render().catch((error: unknown) => {
      if (disposed) return;
      disposeCurrent();
      showError(error instanceof Error ? error.message : String(error));
    });
  });
  const changeMaterial = () => {
    mtlxScene?.setMaterial(materialSelectEl.value);
    previewState.material = materialSelectEl.value;
    vscode?.setState(previewState);
  };
  const geometryStatus = document.getElementById('geometry-status') as HTMLOutputElement;
  const changeGeometry = async () => {
    const request = ++geometryGeneration;
    const name = geometrySelectEl.value;
    geometryStatus.textContent = `Loading geometry: ${name}…`;
    try {
      await loadGeometry(name);
      if (disposed || request !== geometryGeneration) return;
      mtlxScene?.setGeometry(name);
      previewState.geometry = name;
      geometryStatus.textContent = '';
      saveCamera();
    } catch (error) {
      if (disposed || request !== geometryGeneration) return;
      geometrySelectEl.value = mtlxScene?.geometry ?? 'totem';
      geometryStatus.textContent = `Geometry failed to load: ${error instanceof Error ? error.message : String(error)}`;
      log(geometryStatus.textContent);
    }
  };
  materialSelectEl.addEventListener('change', changeMaterial);
  geometrySelectEl.addEventListener('change', changeGeometry);
  own(() => materialSelectEl.removeEventListener('change', changeMaterial));
  own(() => geometrySelectEl.removeEventListener('change', changeGeometry));
}

function onMessage(
  event: MessageEvent<PreviewPayload | (PreviewAssetBytes & { type: 'asset'; requestId: number; error?: string })>,
): void {
  if ('type' in event.data && event.data.type === 'asset') {
    const reply = event.data;
    const pending = pendingAssets.get(reply.requestId);
    if (reply.error) pending?.reject(new Error(reply.error));
    else pending?.resolve(reply);
    return;
  }
  const payload = event.data as PreviewPayload;
  const generation = ++payloadGeneration;
  disposeCurrent();
  const settings = payload.settings ?? parsePreviewSettings({});
  const settingsKey = JSON.stringify(settings);
  if (previewState.settingsKey !== settingsKey) {
    previewState.settingsKey = settingsKey;
    previewState.environmentKind = settings.defaultIbl;
    previewState.geometry = settings.defaultGeometry;
    previewState.rotating = settings.autoRotate;
    previewState.bloom = settings.bloom;
    previewState.ao = settings.ao;
    previewState.toneMapping = settings.toneMapping;
    delete previewState.camera;
  }
  lastPayload = payload;
  failedResources = [];
  lastLoggedChecks = '';
  logEl.replaceChildren();
  for (const warning of settings.warnings) log(`Settings: ${warning}`);
  const settingsStatus = document.getElementById('settings-status');
  if (settingsStatus) settingsStatus.textContent = settings.warnings.join(' ');
  errorEl.style.display = 'none';
  setPreviewStatus(payload.parseError ? undefined : 'loading');

  if (payload.parseError) {
    disposeCurrent();
    errorEl.textContent = payload.parseError;
    errorEl.style.display = 'block';
  }
  renderStats(payload);

  if (!payload.parseError && payload.data && payload.shaderBall) {
    renderScene(payload.data, payload.fileName, payload.textures, payload.shaderBall, settings).catch(
      (error: unknown) => {
        if (generation !== payloadGeneration) return;
        disposeCurrent();
        showError(`3D preview error: ${error instanceof Error ? error.message : String(error)}`);
      },
    );
  }
}

log('Preview script loaded, waiting for document data...');

window.addEventListener('message', onMessage);

// Register before requesting data, including when VS Code recreates a hidden webview.
// oxlint-disable-next-line unicorn/require-post-message-target-origin
vscode?.postMessage({ type: 'ready' });
