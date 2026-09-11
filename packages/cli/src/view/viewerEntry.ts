/**
 * Browser-side script for `mtlx view`, bundled by scripts/build-viewer.mjs (esbuild, same
 * pattern as the VS Code extension's build-preview.js). It fetches the target file straight from
 * the local preview server by relative URL — since the server roots its static routes at the
 * file's own directory (see ../view/server.ts), a loose .mtlx's relative texture references
 * resolve as ordinary browser fetches with no remapping needed.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMtlxScene, parseStudioEnvironment, type GeometryKind, type MtlxScene } from 'mtlx-viewer';
// esbuild's dataurl loader (see build-viewer.mjs) inlines this as a base64 data: URL string.
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

declare const window: Window & { __MTLX_FILE__?: string };

const canvasEl = document.getElementById('viewport') as HTMLCanvasElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;

function showError(message: string): void {
  console.error(`[mtlx view] ${message}`);
  errorEl.textContent = message;
}

window.addEventListener('error', (event) => showError(`Uncaught error: ${event.message}`));
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as unknown;
  showError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function populateMaterialSelect(scene: MtlxScene): void {
  materialSelectEl.innerHTML = scene.materialNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  materialSelectEl.value = scene.activeMaterial;
  materialSelectEl.disabled = scene.materialNames.length <= 1;
}

async function main(): Promise<void> {
  const fileName = window.__MTLX_FILE__;
  if (!fileName) {
    showError('No file specified.');
    return;
  }

  const renderer = new THREE.WebGPURenderer({ canvas: canvasEl, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  await renderer.init();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 1000);

  // @types/three lags three's addon source: fromEquirectangular() isn't in its PMREMGenerator
  // typings yet.
  const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
    fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture };
  };
  const envTexture = await parseStudioEnvironment(dataUrlToArrayBuffer(studioEnvironmentDataUrl));
  const environment = pmremGenerator.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  scene.environment = environment;
  scene.background = environment;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  let clock = performance.now();
  let mtlxScene: MtlxScene | undefined;
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    mtlxScene?.update((now - clock) / 1000);
    clock = now;
    controls.update();
    void renderer.renderAsync(scene, camera);
  });

  try {
    const [data, shaderBall] = await Promise.all([
      fetch(fileName).then((r) => r.arrayBuffer()),
      fetch('/__mtlx_view__/shaderball.glb').then((r) => r.arrayBuffer()),
    ]);
    mtlxScene = await createMtlxScene(camera, controls, { data, fileName, shaderBall });
    scene.add(mtlxScene.root);
    populateMaterialSelect(mtlxScene);
  } catch (error) {
    showError(`MaterialX preview error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  materialSelectEl.addEventListener('change', () => mtlxScene?.setMaterial(materialSelectEl.value));
  geometrySelectEl.addEventListener('change', () => mtlxScene?.setGeometry(geometrySelectEl.value as GeometryKind));
}

main().catch((error: unknown) => showError(error instanceof Error ? error.message : String(error)));
