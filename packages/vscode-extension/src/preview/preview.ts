/**
 * Webview preview script — receives the raw file bytes + host-computed stats from the
 * extension and renders a three.js 3D preview plus a stats/validation panel. Bundled with
 * esbuild (including three.js) the same way hdrify bundles its tonemapper into preview.js.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';
import { parseStudioEnvironment } from 'mtlx-viewer';
// esbuild's dataurl loader (see build-preview.js) inlines this as a base64 data: URL string.
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

declare const acquireVsCodeApi: (() => { postMessage(message: unknown): void }) | undefined;
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

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
}

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const logEl = document.getElementById('log') as HTMLDivElement;

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
  const validityHtml = `<p class="${payload.valid ? 'valid' : 'invalid'}">${payload.valid ? '✓ Valid' : '✗ Invalid'}</p>`;

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

async function renderScene(data: ArrayBuffer, fileName: string, textures: PreviewTexture[]): Promise<void> {
  // Scaffolding: a plain gray sphere goes up immediately so the viewport never sits fully black
  // while the renderer/loader are still starting up — replaced once (if) the real material loads.
  const width = canvasEl.clientWidth || 512;
  const height = canvasEl.clientHeight || 512;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
  camera.position.set(0, 0, 3.2);

  const sphere = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: true }),
  );
  scene.add(sphere);

  log('Creating WebGPURenderer...');
  const renderer = new THREE.WebGPURenderer({ canvas: canvasEl, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  await renderer.init();
  const backend = (renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
  log(`Renderer ready (backend: ${backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2 fallback'}).`);

  log('Loading studio environment...');
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = await parseStudioEnvironment(dataUrlToArrayBuffer(studioEnvironmentDataUrl));
  const environment = pmremGenerator.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  scene.environment = environment;
  scene.background = environment;
  log('Environment ready.');

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const resize = () => {
    const w = canvasEl.clientWidth || 512;
    const h = canvasEl.clientHeight || 512;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  new ResizeObserver(resize).observe(canvasEl);

  // Start the animation loop right away so the scaffold sphere is visibly spinning/orbitable
  // even if material loading below fails.
  renderer.setAnimationLoop(() => {
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
    // A zip-packaged .mtlz/.mtlx.zip resolves its textures from inside the archive on its own and
    // never reaches this map, so it's a no-op there.
    if (textures.length) {
      const textureUrls = new Map(textures.map((t) => [t.path, URL.createObjectURL(new Blob([t.data]))]));
      manager.setURLModifier((url) => textureUrls.get(url) ?? url);
      log(`Embedded ${textureUrls.size} referenced texture(s) from disk.`);
    }

    // @types/three lags three's addon source: parseBuffer (native .mtlz/.mtlx.zip support)
    // isn't in its MaterialXLoader typings yet.
    const loader = new MaterialXLoader(manager) as unknown as {
      parseBuffer: (data: ArrayBuffer, url?: string) => { materials: Record<string, THREE.Material> };
    };
    const result = loader.parseBuffer(data, fileName);
    const material = Object.values(result.materials).at(-1);
    if (!material) {
      throw new Error('No materials found in this MaterialX document');
    }
    sphere.material = material;
    log('Material applied.');
  } catch (error) {
    showError(`MaterialX parse error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function onMessage(event: MessageEvent<PreviewPayload>): void {
  const payload = event.data;

  if (payload.parseError) {
    errorEl.textContent = payload.parseError;
    errorEl.style.display = 'block';
  }
  renderStats(payload);

  if (payload.data) {
    renderScene(payload.data, payload.fileName, payload.textures).catch((error: unknown) => {
      showError(`3D preview error: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}

log('Preview script loaded, waiting for document data...');

window.addEventListener('message', onMessage);
