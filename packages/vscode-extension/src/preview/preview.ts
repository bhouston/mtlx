/**
 * Webview preview script — receives the raw file bytes + host-computed stats from the
 * extension and renders a three.js 3D preview plus a stats/validation panel. Bundled with
 * esbuild (including three.js) the same way hdrify bundles its tonemapper into preview.js.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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

interface PreviewPayload {
  fileName: string;
  fileSize: number;
  valid: boolean;
  issues: ValidationIssue[];
  summary?: MaterialXSummary;
  parseError?: string;
  data?: ArrayBuffer;
}

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;

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

async function renderScene(data: ArrayBuffer, fileName: string): Promise<void> {
  const width = canvasEl.clientWidth || 512;
  const height = canvasEl.clientHeight || 512;

  const renderer = new THREE.WebGPURenderer({ canvas: canvasEl, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  await renderer.init();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);
  camera.position.set(0, 0, 3.2);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.background = environment;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const sphere = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshStandardMaterial(),
  );
  scene.add(sphere);

  try {
    // @types/three lags three's addon source: parseBuffer (native .mtlz/.mtlx.zip support)
    // isn't in its MaterialXLoader typings yet.
    const loader = new MaterialXLoader() as unknown as {
      parseBuffer: (data: ArrayBuffer, url?: string) => { materials: Record<string, THREE.Material> };
    };
    const result = loader.parseBuffer(data, fileName);
    const material = Object.values(result.materials).at(-1);
    if (!material) {
      throw new Error('No materials found in this MaterialX document');
    }
    sphere.material = material;
  } catch (error) {
    errorEl.textContent = `3D preview error: ${error instanceof Error ? error.message : String(error)}`;
    errorEl.style.display = 'block';
  }

  const resize = () => {
    const w = canvasEl.clientWidth || 512;
    const h = canvasEl.clientHeight || 512;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  new ResizeObserver(resize).observe(canvasEl);

  renderer.setAnimationLoop(() => {
    controls.update();
    void renderer.renderAsync(scene, camera);
  });
}

function onMessage(event: MessageEvent<PreviewPayload>): void {
  const payload = event.data;

  if (payload.parseError) {
    errorEl.textContent = payload.parseError;
    errorEl.style.display = 'block';
  }
  renderStats(payload);

  if (payload.data) {
    void renderScene(payload.data, payload.fileName);
  }
}

window.addEventListener('message', onMessage);
