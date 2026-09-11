/**
 * Webview preview script — receives the raw file bytes + host-computed stats from the
 * extension and renders a three.js 3D preview plus a stats/validation panel. Bundled with
 * esbuild (including three.js) the same way hdrify bundles its tonemapper into preview.js.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createMtlxScene,
  parseEnvironment,
  createEnvironmentSwitcher,
  type EnvironmentKind,
  type GeometryKind,
  type MtlxScene,
} from 'mtlx-viewer';
// esbuild's dataurl loader (see build-preview.js) inlines this as a base64 data: URL string.
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

interface PreviewState {
  material?: string;
  geometry?: GeometryKind;
  rotating?: boolean;
  detailsOpen?: boolean;
  exposure?: number;
  environmentIntensity?: number;
  environmentKind?: EnvironmentKind;
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

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const logEl = document.getElementById('log') as HTMLDivElement;
const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;
const previewStatusEl = document.getElementById('preview-status') as HTMLOutputElement;
const rotationEl = document.getElementById('rotation') as HTMLButtonElement;
const resetEl = document.getElementById('reset') as HTMLButtonElement;
let lastPayload: PreviewPayload | undefined;
let failedResources: string[] = [];
const logLines: string[] = [];
function setPreviewStatus(value: string) {
  previewStatusEl.textContent = `Preview: ${value}`;
}

// Diagnostics console: every step of renderer/loader setup is logged here (visible in the
// webview itself, no devtools needed) and mirrored to the extension host's Output channel via
// postMessage, since a rejected promise or thrown error in a webview otherwise vanishes with no
// trace — exactly what produced the "stuck progress bar, black canvas, no error" symptom.
function log(message: string): void {
  console.log(`[mtlx-preview] ${message}`);
  logLines.push(message);
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

function renderStats(payload: PreviewPayload): void {
  const documentValid =
    !payload.parseError &&
    !payload.issues.some(
      (issue) => issue.level === 'error' && issue.rule !== 'resources' && issue.rule !== 'renderer-support',
    );
  const resourceErrors = payload.issues.filter((issue) => issue.level === 'error' && issue.rule === 'resources').length;
  const validityHtml = `<output aria-live="polite"><p>Document: <span class="${documentValid ? 'valid' : 'invalid'}">${documentValid ? 'Document checks passed' : 'Document checks failed'}</span></p><p>Resources: ${resourceErrors ? `${resourceErrors} issues` : failedResources.length ? `${failedResources.length} failed to load` : payload.resourcesChecked ? 'Dependency checks passed' : 'Unavailable for checking'}</p></output><p>${payload.issues.filter((issue) => issue.level === 'warning').length} warnings. Checks: XML, structure, types, dependencies and renderer categories. Shader compilation is checked by the preview.</p>`;

  const issuesHtml = payload.issues.length
    ? `<h2>Issues</h2><ul>${payload.issues
        .map(
          (issue) =>
            `<li class="issue-${issue.level}">${issue.level.toUpperCase()} ${escapeHtml(issue.location)}: ${escapeHtml(issue.message)}</li>`,
        )
        .join('')}</ul>`
    : '';

  const summary = payload.summary;
  const summaryHtml = summary
    ? `
    <dl>
      <dt>File</dt><dd>${escapeHtml(payload.fileName)}</dd>
      <dt>Size</dt><dd>${formatFileSize(payload.fileSize)}</dd>
      <dt>Version</dt><dd>${escapeHtml(summary.version ?? 'unknown')}</dd>
      <dt>Colorspace</dt><dd>${escapeHtml(summary.colorspace ?? 'unknown')}</dd>
      <dt>Node graphs</dt><dd>${summary.nodeGraphCount}</dd>
      <dt>Top-level nodes</dt><dd>${summary.topLevelNodeCount}</dd>
    </dl>
    <h2>Materials (surfaces/volumes)</h2>
    <ul>${summary.materials.map((m) => `<li>${escapeHtml(m.name ?? '(unnamed)')} [${escapeHtml(m.category)}]</li>`).join('') || '<li>(none)</li>'}</ul>
    <h2>Referenced textures</h2>
    <ul>${summary.referencedTextures.map((t) => `<li>${escapeHtml(t)}</li>`).join('') || '<li>(none)</li>'}</ul>
    <details><summary>Internal nodes (${summary.nodes.length})</summary>
    <ul>${summary.nodes.map((n) => `<li>${escapeHtml(n.name ?? '(unnamed)')} [${escapeHtml(n.category)}]</li>`).join('') || '<li>(none)</li>'}</ul></details>
  `
    : `<dl><dt>File</dt><dd>${escapeHtml(payload.fileName)}</dd></dl>`;

  statsEl.innerHTML =
    validityHtml +
    issuesHtml +
    (failedResources.length
      ? `<h2>Failed resources</h2><ul>${failedResources.map((url) => `<li>${escapeHtml(url)}</li>`).join('')}</ul>`
      : '') +
    summaryHtml;
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
      const response = await fetch(document.body.dataset.hdrUrl!, { signal: environmentAbort.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} loading IBL`);
      return parseEnvironment(kind, await response.arrayBuffer());
    },
    (texture) => pmremGenerator.fromEquirectangular(texture),
    (texture) => {
      scene.environment = texture;
      scene.background = texture;
    },
  );
  own(() => environments.dispose());
  const environmentSelect = document.getElementById('environment-select') as HTMLSelectElement;
  environmentSelect.value = previewState.environmentKind === 'default' ? 'default' : 'studio';
  const environmentStatus = document.getElementById('environment-status') as HTMLOutputElement;
  const changeEnvironment = async () => {
    const kind = environmentSelect.value as EnvironmentKind;
    previewState.environmentKind = kind;
    vscode?.setState(previewState);
    environmentStatus.textContent = 'Loading environment…';
    try {
      if (await environments.set(kind)) {
        environmentStatus.textContent = '';
        log(`Environment ready: ${kind === 'studio' ? 'Studio' : 'San Giuseppe Bridge'}.`);
      }
    } catch (error) {
      if (disposed || kind !== previewState.environmentKind) return;
      environmentStatus.textContent = `Environment failed to load: ${error instanceof Error ? error.message : String(error)}`;
      log(environmentStatus.textContent);
    }
  };
  environmentSelect.addEventListener('change', changeEnvironment);
  own(() => environmentSelect.removeEventListener('change', changeEnvironment));
  await changeEnvironment();
  if (disposed) return;

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
    if (previewState.geometry) mtlxScene.setGeometry(previewState.geometry);
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
    rotationEl.textContent = mtlxScene?.autoRotate ? 'Pause rotation' : 'Resume rotation';
    rotationEl.setAttribute('aria-pressed', String(!mtlxScene?.autoRotate));
  };
  const motionChanged = () => {
    if (mtlxScene) mtlxScene.autoRotate = !preference.matches && (previewState.rotating ?? true);
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
    if (mtlxScene) mtlxScene.autoRotate = !mtlxScene.autoRotate;
    previewState.rotating = mtlxScene?.autoRotate;
    updateRotation();
    saveCamera();
  };
  const reset = () => {
    mtlxScene?.resetCamera();
    saveCamera();
  };
  rotationEl.addEventListener('click', toggleRotation);
  resetEl.addEventListener('click', reset);
  own(() => {
    rotationEl.removeEventListener('click', toggleRotation);
    resetEl.removeEventListener('click', reset);
  });
  await renderer.renderAsync(scene, camera);
  if (disposed) return;
  rotationEl.disabled = false;
  resetEl.disabled = false;
  setPreviewStatus('ready');
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const deltaSeconds = (now - clock) / 1000;
    clock = now;
    mtlxScene?.update(deltaSeconds);
    controls.update();
    void renderer.renderAsync(scene, camera).catch((error: unknown) => {
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
  const changeGeometry = () => {
    mtlxScene?.setGeometry(geometrySelectEl.value as GeometryKind);
    previewState.geometry = geometrySelectEl.value as GeometryKind;
    saveCamera();
  };
  materialSelectEl.addEventListener('change', changeMaterial);
  geometrySelectEl.addEventListener('change', changeGeometry);
  own(() => materialSelectEl.removeEventListener('change', changeMaterial));
  own(() => geometrySelectEl.removeEventListener('change', changeGeometry));
}

function onMessage(event: MessageEvent<PreviewPayload>): void {
  const payload = event.data;
  const generation = ++payloadGeneration;
  disposeCurrent();
  lastPayload = payload;
  failedResources = [];
  logLines.length = 0;
  logEl.replaceChildren();
  errorEl.style.display = 'none';
  setPreviewStatus(payload.parseError ? 'unavailable: document could not be parsed' : 'loading');

  if (payload.parseError) {
    disposeCurrent();
    errorEl.textContent = payload.parseError;
    errorEl.style.display = 'block';
  }
  renderStats(payload);

  if (!payload.parseError && payload.data && payload.shaderBall) {
    renderScene(payload.data, payload.fileName, payload.textures, payload.shaderBall).catch((error: unknown) => {
      if (generation !== payloadGeneration) return;
      disposeCurrent();
      showError(`3D preview error: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}

log('Preview script loaded, waiting for document data...');

window.addEventListener('message', onMessage);

// Register before requesting data, including when VS Code recreates a hidden webview.
// oxlint-disable-next-line unicorn/require-post-message-target-origin
vscode?.postMessage({ type: 'ready' });
document.getElementById('refresh')?.addEventListener('click', () => {
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  vscode?.postMessage({ type: 'refresh' });
});

const detailsEl = document.getElementById('details') as HTMLButtonElement;
const updateDetails = () => {
  statsEl.hidden = previewState.detailsOpen === false;
  detailsEl.textContent = statsEl.hidden ? 'Show details' : 'Hide details';
  detailsEl.setAttribute('aria-expanded', String(!statsEl.hidden));
};
updateDetails();
detailsEl.addEventListener('click', () => {
  previewState.detailsOpen = statsEl.hidden;
  updateDetails();
  vscode?.setState(previewState);
});
const fullscreenEl = document.getElementById('fullscreen') as HTMLButtonElement;
fullscreenEl.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    log('Fullscreen is unavailable in this editor. Use VS Code: Toggle Full Screen.');
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreenEl.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
});
const diagnostics = () =>
  JSON.stringify(
    {
      fileName: lastPayload?.fileName,
      fileSize: lastPayload?.fileSize,
      issues: lastPayload?.issues,
      summary: lastPayload?.summary,
      resourcesChecked: lastPayload?.resourcesChecked,
      failedResources,
      preview: previewStatusEl.textContent,
      log: logLines,
    },
    null,
    2,
  );
for (const [id, type] of [
  ['copy-diagnostics', 'copyDiagnostics'],
  ['download-diagnostics', 'downloadDiagnostics'],
]) {
  document.getElementById(id!)?.addEventListener('click', () => {
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    vscode?.postMessage({ type, diagnostics: diagnostics() });
  });
}
