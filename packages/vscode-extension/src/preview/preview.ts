/**
 * Webview preview script — receives the raw file bytes + host-computed stats from the
 * extension and renders a three.js 3D preview plus a stats/validation panel. Bundled with
 * esbuild (including three.js) the same way hdrify bundles its tonemapper into preview.js.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMtlxScene, parseStudioEnvironment, type GeometryKind, type MtlxScene } from 'mtlx-viewer';
// esbuild's dataurl loader (see build-preview.js) inlines this as a base64 data: URL string.
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

interface PreviewState {
  material?: string;
  geometry?: GeometryKind;
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
}

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const logEl = document.getElementById('log') as HTMLDivElement;
const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;

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
  const validityHtml = `<p class="${payload.valid ? 'valid' : 'invalid'}">${payload.valid ? '✓ Selected document checks passed' : '✗ Document checks failed'}</p><p>${payload.issues.filter((issue) => issue.level === 'warning').length} warnings. Full MaterialX conformance and shader compatibility are not established.</p>`;

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
    <h2>Internal nodes</h2>
    <ul>${summary.nodes.map((n) => `<li>${escapeHtml(n.name ?? '(unnamed)')} [${escapeHtml(n.category)}]</li>`).join('') || '<li>(none)</li>'}</ul>
  `
    : `<dl><dt>File</dt><dd>${escapeHtml(payload.fileName)}</dd></dl>`;

  statsEl.innerHTML = validityHtml + summaryHtml + issuesHtml;
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

  log('Loading studio environment...');
  // @types/three lags three's addon source: fromEquirectangular() isn't in its PMREMGenerator
  // typings yet.
  const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
    fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
    dispose(): void;
  };
  own(() => pmremGenerator.dispose());
  const envTexture = await parseStudioEnvironment(dataUrlToArrayBuffer(studioEnvironmentDataUrl));
  if (disposed) {
    envTexture.dispose();
    return;
  }
  const environmentTarget = pmremGenerator.fromEquirectangular(envTexture);
  own(() => environmentTarget.dispose());
  const environment = environmentTarget.texture;
  envTexture.dispose();
  scene.environment = environment;
  scene.background = environment;
  log('Environment ready.');

  const controls = new OrbitControls(camera, renderer.domElement);
  own(() => controls.dispose());
  controls.enableDamping = true;

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
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const deltaSeconds = (now - clock) / 1000;
    clock = now;
    mtlxScene?.update(deltaSeconds);
    controls.update();
    void renderer.renderAsync(scene, camera);
  });

  try {
    log(`Parsing MaterialX document (${fileName})...`);
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => log(`Loading ${url}: ${loaded}/${total}`);
    manager.onError = (url) => log(`Failed to load resource: ${url}`);

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
      manager.setURLModifier((url) => textureUrls.get(url) ?? url);
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

  const changeMaterial = () => {
    mtlxScene?.setMaterial(materialSelectEl.value);
    previewState.material = materialSelectEl.value;
    vscode?.setState(previewState);
  };
  const changeGeometry = () => {
    mtlxScene?.setGeometry(geometrySelectEl.value as GeometryKind);
    previewState.geometry = geometrySelectEl.value as GeometryKind;
    vscode?.setState(previewState);
  };
  materialSelectEl.addEventListener('change', changeMaterial);
  geometrySelectEl.addEventListener('change', changeGeometry);
  own(() => materialSelectEl.removeEventListener('change', changeMaterial));
  own(() => geometrySelectEl.removeEventListener('change', changeGeometry));
}

function onMessage(event: MessageEvent<PreviewPayload>): void {
  const payload = event.data;
  const generation = ++payloadGeneration;

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
