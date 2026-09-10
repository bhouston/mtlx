/**
 * Shared MaterialX preview scene: parses a document, offers every material it defines for
 * selection, and renders the active one onto one of three swappable geometries. Used by both the
 * website and the VS Code extension so they don't each reimplement this.
 *
 * Callers own the renderer/camera/controls/animation-loop (each host has its own conventions for
 * that already) and just add `.root` to their scene and call `.update(deltaSeconds)` each frame.
 */
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';

export type GeometryKind = 'totem' | 'sphere' | 'plane';

export interface MtlxSceneOptions {
  /** Raw .mtlx / .mtlz / .mtlx.zip bytes. */
  data: ArrayBuffer;
  /** Passed through to MaterialXLoader for resource-path resolution and archive sniffing. */
  fileName: string;
  /** Defaults to the document's last material (matches prior single-material behavior). */
  materialName?: string;
  /** Defaults to 'totem'. */
  geometry?: GeometryKind;
  /** Defaults to true. */
  autoRotate?: boolean;
  /** The shaderball (`mtlx-viewer/assets/shaderball.glb`) used for the 'totem' geometry. */
  shaderBall: ArrayBuffer;
  /** Supply your own if you need setURLModifier/onProgress/onError (e.g. for texture blobs). */
  manager?: THREE.LoadingManager;
}

export interface MtlxScene {
  /** Add this to your THREE.Scene. */
  root: THREE.Group;
  materialNames: string[];
  activeMaterial: string;
  geometry: GeometryKind;
  autoRotate: boolean;
  setMaterial(name: string): void;
  setGeometry(kind: GeometryKind): void;
  /** Call every frame; advances the auto-rotation. */
  update(deltaSeconds: number): void;
}

// One full turn every 20s - slow enough to inspect the material, still reads as "spinning".
const ROTATION_RADIANS_PER_SECOND = (2 * Math.PI) / 20;

interface MaterialXParseResult {
  materials: Record<string, THREE.Material>;
}

function parseMaterialX(manager: THREE.LoadingManager, data: ArrayBuffer, fileName: string): MaterialXParseResult {
  // @types/three lags three's addon source: parseBuffer (native .mtlz/.mtlx.zip support) isn't
  // in its MaterialXLoader typings yet.
  const loader = new MaterialXLoader(manager) as unknown as {
    parseBuffer: (data: ArrayBuffer, url?: string) => MaterialXParseResult;
  };
  return loader.parseBuffer(data, fileName);
}

async function loadShaderBall(manager: THREE.LoadingManager, shaderBall: ArrayBuffer): Promise<THREE.Group> {
  // ponytail: no MikkTSpace tangent precompute (unlike three.js's own webgpu_loader_materialx.html
  // example) — normal maps fall back to derivative-based tangents, a little lower quality but no
  // extra ~100KB of bundled tangent-space-generation code for a preview viewer. Add
  // computeMikkTSpaceTangents() here if that visibly matters.
  const gltf = await new GLTFLoader(manager).parseAsync(shaderBall, '');
  return gltf.scene as unknown as THREE.Group;
}

function buildSphere(): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), new THREE.MeshStandardMaterial());
}

function buildPlane(): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial());
  mesh.material.side = THREE.DoubleSide;
  return mesh;
}

function applyMaterial(object: THREE.Object3D, material: THREE.Material): void {
  object.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      (node as THREE.Mesh).material = material;
    }
  });
}

/** Frames the camera above and back from `object`, looking down at it, sized to its bounding box. */
function frameObject(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void },
  object: THREE.Object3D,
): void {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 0.01) * 0.5;
  const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.4;
  const elevation = THREE.MathUtils.degToRad(35); // looking down at the object, not head-on
  camera.position.set(center.x, center.y + distance * Math.sin(elevation), center.z + distance * Math.cos(elevation));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  camera.lookAt(center);
  controls.update();
}

export async function createMtlxScene(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void },
  options: MtlxSceneOptions,
): Promise<MtlxScene> {
  const manager = options.manager ?? new THREE.LoadingManager();
  const { materials } = parseMaterialX(manager, options.data, options.fileName);
  const materialNames = Object.keys(materials);
  if (materialNames.length === 0) {
    throw new Error('No materials found in this MaterialX document');
  }

  const geometries: Record<GeometryKind, THREE.Object3D> = {
    totem: await loadShaderBall(manager, options.shaderBall),
    sphere: buildSphere(),
    plane: buildPlane(),
  };
  const root = new THREE.Group();
  for (const object of Object.values(geometries)) root.add(object);

  const applyVisibility = (active: GeometryKind) => {
    for (const [kind, object] of Object.entries(geometries)) object.visible = kind === active;
  };

  const scene: MtlxScene = {
    root,
    materialNames,
    activeMaterial:
      options.materialName && materials[options.materialName] ? options.materialName : materialNames.at(-1)!,
    geometry: options.geometry ?? 'totem',
    autoRotate: options.autoRotate ?? true,
    setMaterial(name) {
      const material = materials[name];
      if (!material) return;
      scene.activeMaterial = name;
      applyMaterial(geometries[scene.geometry], material);
    },
    setGeometry(kind) {
      scene.geometry = kind;
      applyVisibility(kind);
      applyMaterial(geometries[kind], materials[scene.activeMaterial]!);
      frameObject(camera, controls, geometries[kind]);
    },
    update(deltaSeconds) {
      if (scene.autoRotate) {
        geometries[scene.geometry].rotation.y += ROTATION_RADIANS_PER_SECOND * deltaSeconds;
      }
    },
  };

  applyVisibility(scene.geometry);
  applyMaterial(geometries[scene.geometry], materials[scene.activeMaterial]!);
  frameObject(camera, controls, geometries[scene.geometry]);

  return scene;
}
