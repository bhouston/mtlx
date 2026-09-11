import type { MtlxScene, CleanupScope } from 'mtlx-viewer';
import type { PerspectiveCamera } from 'three/webgpu';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PreviewSettings } from '../previewSettings.js';
import { previewState } from './state.js';
import { vscode } from './host.js';
import { log } from './diagnostics.js';

export function bindSceneControls(
  mtlxScene: MtlxScene,
  camera: PerspectiveCamera,
  controls: OrbitControls,
  scope: CleanupScope,
  settings: PreviewSettings,
  loadGeometry: (name: string) => Promise<void>,
): void {
  const own = (release: () => void) => scope.own(release);
  const materialSelectEl = document.getElementById('material-select') as HTMLSelectElement;
  const geometrySelectEl = document.getElementById('geometry-select') as HTMLSelectElement;
  const rotationEl = document.getElementById('rotation') as HTMLInputElement;
  let geometryGeneration = 0;
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
  rotationEl.addEventListener('change', toggleRotation);
  own(() => rotationEl.removeEventListener('change', toggleRotation));
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
      if (scope.disposed || request !== geometryGeneration) return;
      mtlxScene?.setGeometry(name);
      previewState.geometry = name;
      geometryStatus.textContent = '';
      saveCamera();
    } catch (error) {
      if (scope.disposed || request !== geometryGeneration) return;
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
