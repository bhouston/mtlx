/**
 * Shared MaterialX preview scene: parses a document, offers every material it defines for
 * selection, and renders the active one onto one of three swappable geometries. Used by both the
 * website and the VS Code extension so they don't each reimplement this.
 *
 * Callers own the renderer/camera/controls/animation-loop (each host has its own conventions for
 * that already) and just add `.root` to their scene and call `.update(deltaSeconds)` each frame.
 */
import { collectDisposables } from './disposal.js';
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';

/**
 * *Options for {@link createMtlxScene}.*
 *
 * @category Viewer
 */
export interface MtlxSceneOptions {
  /** Raw .mtlx / .mtlx.zip bytes. */
  data: ArrayBuffer;
  /** Passed through to MaterialXLoader for resource-path resolution and archive sniffing. */
  fileName: string;
  /** Defaults to the document's last material (matches prior single-material behavior). */
  materialName?: string;
  /** Defaults to 'totem'. */
  geometry?: string;
  /** Defaults to true. */
  autoRotate?: boolean;
  /** The shaderball (`mtlx-viewer/assets/shaderball.glb`) used for the 'totem' geometry. */
  shaderBall: ArrayBuffer;
  /** Supply your own if you need setURLModifier/onProgress/onError (e.g. for texture blobs). */
  manager?: THREE.LoadingManager;
}

/**
 * *A live MaterialX preview scene, returned by {@link createMtlxScene}.*
 *
 * @category Viewer
 */
export interface MtlxScene {
  /** Add this to your THREE.Scene. */
  root: THREE.Group;
  materialNames: string[];
  activeMaterial: string;
  geometry: string;
  autoRotate: boolean;
  /** Releases owned geometries, materials and textures; safe to call repeatedly. */
  dispose(): void;
  setMaterial(name: string): void;
  hasGeometry(name: string): boolean;
  setGeometry(kind: string): void;
  /** Load an additional named glTF/GLB geometry; this scene owns its resources. */
  addGeometry(name: string, data: ArrayBuffer, manager?: THREE.LoadingManager): Promise<void>;
  /** Restore every geometry's orientation and the initial camera framing. */
  resetCamera(): void;
  /** Call every frame; advances the auto-rotation. */
  update(deltaSeconds: number): void;
}

// One full turn every 40s - slow enough to inspect the material, still reads as "spinning".
const ROTATION_RADIANS_PER_SECOND = (2 * Math.PI) / 40;

interface MaterialXParseResult {
  materials: Record<string, THREE.Material>;
  dispose(): void;
}

function parseMaterialX(manager: THREE.LoadingManager, data: ArrayBuffer, fileName: string): MaterialXParseResult {
  // @types/three lags three's addon source: parseBuffer (native .mtlx.zip archive support) isn't
  // in its MaterialXLoader typings yet.
  const loader = new MaterialXLoader(manager) as unknown as {
    parseBuffer: (data: ArrayBuffer, url?: string) => Pick<MaterialXParseResult, 'materials'>;
    dispose(): void;
  };
  const signature = new Uint8Array(data, 0, Math.min(4, data.byteLength));
  const archive = signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 3 && signature[3] === 4;
  try {
    // Archive textures resolve to blob URLs. ImageBitmapLoader prepends its path even to
    // absolute URLs, so an archive must not inherit the document's HTTP/filesystem folder.
    const result = loader.parseBuffer(data, archive ? '' : fileName);
    return { ...result, dispose: () => loader.dispose() };
  } catch (error) {
    loader.dispose();
    throw error;
  }
}

// MaterialX documents that build their normal via a <normalmap> node graph (procedural bump ->
// normalmap, e.g. brick/road_aggregate) compile to TSL nodes wired to the real per-vertex
// `tangent` attribute (not a screen-space-derivative fallback). Geometry without that attribute
// reads garbage there and the surface goes flat black — not a MaterialX bug, just missing
// tangents. computeTangents() (approximate, not MikkTSpace) is enough to fix that; it needs an
// index + uv + normal, which all three preview geometries already have.
function computeTangentsIfPossible(geometry: THREE.BufferGeometry): void {
  if (geometry.index && geometry.attributes.uv && geometry.attributes.normal) geometry.computeTangents();
}

async function loadShaderBall(manager: THREE.LoadingManager, shaderBall: ArrayBuffer): Promise<THREE.Group> {
  const gltf = await new GLTFLoader(manager).parseAsync(shaderBall, '');
  const scene = gltf.scene as unknown as THREE.Group;
  scene.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) computeTangentsIfPossible((node as THREE.Mesh).geometry);
  });
  return scene;
}

function buildSphere(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  computeTangentsIfPossible(geometry);
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}

function buildPlane(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2, 2);
  computeTangentsIfPossible(geometry);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
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

/**
 * Wraps `object` so it is centered at the origin and fits a 1 m cube: one uniform scale from the
 * largest extent, so proportions are kept. The wrapper is what rotates, so spinning happens about
 * the object's center; the inner transform only recenters and rescales, leaving vertex data and
 * any shared geometry untouched.
 */
function normalizeToUnitCube(object: THREE.Object3D): THREE.Group {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y, size.z, 1e-6);
  object.scale.setScalar(scale);
  object.position.copy(center).multiplyScalar(-scale);
  return new THREE.Group().add(object);
}

const UNIT_RADIUS = 0.5;

/** Frames the unit cube every geometry is normalized into: above and back, looking down at the origin. */
function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void; enableDamping?: boolean },
): void {
  const distance = (UNIT_RADIUS / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.4;
  const elevation = THREE.MathUtils.degToRad(35); // looking down at the object, not head-on
  camera.position.set(0, distance * Math.sin(elevation), distance * Math.cos(elevation));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  camera.lookAt(controls.target);
  controls.update();
}

/**
 * *Parses a MaterialX document and builds a swappable preview scene for it.* Add the returned
 * scene's `.root` to your `THREE.Scene` and call `.update(deltaSeconds)` each frame.
 *
 * @example
 * ```ts
 * const scene = await createMtlxScene(camera, controls, { data, fileName, shaderBall });
 * threeScene.add(scene.root);
 * ```
 *
 * @category Viewer
 */
export async function createMtlxScene(
  camera: THREE.PerspectiveCamera,
  controls: { target: THREE.Vector3; update: () => void; enableDamping?: boolean },
  options: MtlxSceneOptions,
): Promise<MtlxScene> {
  const manager = options.manager ?? new THREE.LoadingManager();
  const { materials, dispose: disposeDocument } = parseMaterialX(manager, options.data, options.fileName);
  const materialNames = Object.keys(materials);
  if (materialNames.length === 0) {
    disposeDocument();
    throw new Error('No materials found in this MaterialX document');
  }

  let totem: THREE.Group;
  try {
    totem = normalizeToUnitCube(await loadShaderBall(manager, options.shaderBall));
    // Start facing front-right; capture this orientation below as the Reset baseline.
    totem.rotateY(Math.PI / 4);
  } catch (error) {
    collectDisposables(Object.values(materials))();
    disposeDocument();
    throw error;
  }
  const geometries: Record<string, THREE.Object3D> = Object.assign(Object.create(null), {
    totem,
    sphere: normalizeToUnitCube(buildSphere()),
    plane: normalizeToUnitCube(buildPlane()),
  });
  let disposed = false;
  const additionalDisposers: Array<() => void> = [];
  // Capture original glTF/default materials before replacing them with MaterialX materials.
  const disposeResources = collectDisposables([...Object.values(geometries), ...Object.values(materials)]);
  const originalRotations = new Map(Object.values(geometries).map((object) => [object, object.rotation.clone()]));
  const root = new THREE.Group();
  for (const object of Object.values(geometries)) root.add(object);

  const applyVisibility = (active: string) => {
    for (const [kind, object] of Object.entries(geometries)) object.visible = kind === active;
  };

  const scene: MtlxScene = {
    root,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeDocument();
      for (const dispose of additionalDisposers.splice(0)) dispose();
      root.removeFromParent();
      disposeResources();
      root.clear();
    },
    materialNames,
    activeMaterial:
      options.materialName && materials[options.materialName] ? options.materialName : materialNames.at(-1)!,
    geometry: options.geometry && geometries[options.geometry] ? options.geometry : 'totem',
    autoRotate: options.autoRotate ?? true,
    setMaterial(name) {
      const material = materials[name];
      if (!material) return;
      scene.activeMaterial = name;
      applyMaterial(geometries[scene.geometry]!, material);
    },
    async addGeometry(name, data, geometryManager = new THREE.LoadingManager()) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || geometries[name])
        throw new Error(`Invalid or duplicate geometry name: ${name}`);
      const object = normalizeToUnitCube(await loadShaderBall(geometryManager, data));
      const release = collectDisposables([object]);
      if (disposed) {
        release();
        return;
      }
      if (geometries[name]) {
        release();
        throw new Error(`Duplicate geometry name: ${name}`);
      }
      let meshes = 0;
      object.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) meshes++;
      });
      if (!meshes) {
        release();
        throw new Error('Geometry contains no meshes');
      }
      geometries[name] = object;
      originalRotations.set(object, object.rotation.clone());
      object.visible = false;
      root.add(object);
      additionalDisposers.push(release);
    },
    hasGeometry: (name) => !!geometries[name],
    setGeometry(kind) {
      if (!geometries[kind]) return;
      scene.geometry = kind;
      applyVisibility(kind);
      applyMaterial(geometries[kind]!, materials[scene.activeMaterial]!);
    },
    resetCamera() {
      // Drain pending orbit/pan damping before restoring framing, so Reset remains still.
      const damping = controls.enableDamping;
      if (damping !== undefined) {
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = damping;
      }
      for (const [object, rotation] of originalRotations) object.rotation.copy(rotation);
      camera.zoom = 1;
      frameCamera(camera, controls);
    },
    update(deltaSeconds) {
      if (scene.autoRotate) {
        geometries[scene.geometry]!.rotation.y += ROTATION_RADIANS_PER_SECOND * deltaSeconds;
      }
    },
  };

  applyVisibility(scene.geometry);
  applyMaterial(geometries[scene.geometry]!, materials[scene.activeMaterial]!);
  frameCamera(camera, controls);

  return scene;
}
