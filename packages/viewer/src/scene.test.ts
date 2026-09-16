import { createMaterialXZipArchive } from 'mtlx-core';
import { expect, it, vi } from 'vitest';
import * as THREE from 'three/webgpu';
import { createMtlxScene } from './scene.js';
const loaderCalls = vi.hoisted(() => ({ parse: vi.fn(), dispose: vi.fn() }));
vi.mock('three/addons/loaders/MaterialXLoader.js', () => ({
  MaterialXLoader: class {
    dispose() {
      loaderCalls.dispose();
    }
    parseBuffer(data: ArrayBuffer, url: string, options?: { throwOnErrors?: boolean }) {
      loaderCalls.parse(data, url, options);
      if (url === 'empty.mtlx') return { materials: {} };
      if (url === 'partial.mtlx')
        return {
          materials: { sample: new THREE.MeshStandardMaterial() },
          log: [
            { severity: 'error', message: 'Unsupported MaterialX node category "displacement" on "Displacement".' },
            {
              severity: 'warning',
              message: 'standard_surface input "subsurface" is currently ignored in MaterialX translation.',
            },
          ],
        };
      const names = url === 'two.mtlx' ? ['sample', 'other'] : ['sample'];
      return { materials: Object.fromEntries(names.map((name) => [name, new THREE.MeshStandardMaterial()])) };
    }
  },
}));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    async parseAsync() {
      return {
        scene: new THREE.Group().add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())),
      };
    }
  },
}));
it('Reset restores object orientation, camera position, target and zoom without changing selection or rotation preference', async () => {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 1000);
  const controls = { target: new THREE.Vector3(), update: () => {} };
  const scene = await createMtlxScene(camera, controls, {
    data: new ArrayBuffer(0),
    fileName: 'sample.mtlx',
    shaderBall: new ArrayBuffer(0),
  });
  const totem = scene.root.children.find((child) => child.visible)!;
  expect(totem.rotation.y).toBeCloseTo(Math.PI / 4);
  scene.update(5);
  expect(totem.rotation.y).toBeCloseTo(Math.PI / 2);
  scene.resetCamera();
  expect(totem.rotation.y).toBeCloseTo(Math.PI / 4);
  scene.setGeometry('sphere');
  const position = camera.position.clone();
  const target = controls.target.clone();
  scene.update(5);
  camera.position.set(100, 20, -5);
  camera.zoom = 4;
  controls.target.set(3, 2, 1);
  scene.autoRotate = false;
  scene.resetCamera();
  expect(camera.position.toArray()).toEqual(position.toArray());
  expect(camera.zoom).toBe(1);
  expect(controls.target.toArray()).toEqual(target.toArray());
  expect(scene.root.children.find((child) => child.visible)?.rotation.y).toBe(0);
  expect(scene.geometry).toBe('sphere');
  expect(scene.autoRotate).toBe(false);
  scene.dispose();
});

it('loads named geometry, applies the active material, resets it and releases original glTF resources', async () => {
  const scene = await createMtlxScene(
    new THREE.PerspectiveCamera(45, 1),
    { target: new THREE.Vector3(), update: vi.fn() },
    { data: new ArrayBuffer(0), fileName: 'a.mtlx', shaderBall: new ArrayBuffer(0) },
  );
  await scene.addGeometry('__proto__', new ArrayBuffer(0));
  const object = scene.root.children.at(-1)!;
  // Uniformly scaled to fit a unit cube (largest extent 1, proportions kept) and centered.
  const bounds = new THREE.Box3().setFromObject(object);
  expect(Math.max(...bounds.getSize(new THREE.Vector3()).toArray())).toBeCloseTo(1);
  expect(bounds.getCenter(new THREE.Vector3()).length()).toBeLessThan(1e-6);
  const inner = object.children[0]!;
  expect(inner.scale.x).toBe(inner.scale.y);
  expect(inner.scale.y).toBe(inner.scale.z);
  const mesh = object.getObjectByProperty('isMesh', true) as THREE.Mesh;
  const originalMaterial = mesh.material as THREE.Material;
  const disposeMaterial = vi.spyOn(originalMaterial, 'dispose');
  const disposeGeometry = vi.spyOn(mesh.geometry, 'dispose');
  scene.setGeometry('__proto__');
  expect(mesh.material).not.toBe(originalMaterial);
  scene.update(1);
  scene.resetCamera();
  expect(object.rotation.y).toBe(0);
  await expect(scene.addGeometry('sphere', new ArrayBuffer(0))).rejects.toThrow('duplicate');
  await expect(scene.addGeometry('bad name', new ArrayBuffer(0))).rejects.toThrow('Invalid');
  scene.dispose();
  scene.dispose();
  expect(disposeMaterial).toHaveBeenCalledTimes(1);
  expect(disposeGeometry).toHaveBeenCalledTimes(1);
});

it('uses archive-local texture URLs and releases their blob resolver on disposal', async () => {
  loaderCalls.parse.mockClear();
  loaderCalls.dispose.mockClear();
  const mtlxText =
    '<materialx><image name="sample"><input name="file" type="filename" value="textures/a.png"/></image></materialx>';
  const zip = createMaterialXZipArchive([
    { path: 'sample.mtlx', data: new TextEncoder().encode(mtlxText) },
    { path: 'textures/a.png', data: new Uint8Array([1, 2, 3]) },
  ]);
  const data = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
  const createObjectURL = vi.spyOn(URL, 'createObjectURL');
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
  const scene = await createMtlxScene(
    new THREE.PerspectiveCamera(45, 1),
    { target: new THREE.Vector3(), update: vi.fn() },
    { data, fileName: 'https://example.com/materials/compound.mtlx.zip', shaderBall: new ArrayBuffer(0) },
  );
  // Unpacked ourselves and fed the extracted document text through — not the raw archive bytes —
  // so the .exr/.hdr handler (matched by manager.getHandler on the document's own reference
  // strings) actually gets a chance to run for archive-embedded textures.
  expect(loaderCalls.parse).toHaveBeenCalledWith(new TextEncoder().encode(mtlxText).buffer, '', {
    throwOnErrors: false,
  });
  expect(createObjectURL).toHaveBeenCalledTimes(1);
  expect(loaderCalls.dispose).not.toHaveBeenCalled();
  expect(revokeObjectURL).not.toHaveBeenCalled();
  scene.dispose();
  scene.dispose();
  expect(loaderCalls.dispose).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  createObjectURL.mockRestore();
  revokeObjectURL.mockRestore();
});

it('replaces materials in place, keeping geometry, orientation and the selection when it still exists', async () => {
  const camera = new THREE.PerspectiveCamera(45, 1);
  const scene = await createMtlxScene(
    camera,
    { target: new THREE.Vector3(), update: vi.fn() },
    { data: new ArrayBuffer(0), fileName: 'two.mtlx', shaderBall: new ArrayBuffer(0) },
  );
  scene.setGeometry('sphere');
  scene.setMaterial('sample');
  const sphere = scene.root.children.find((child) => child.visible)!;
  sphere.rotation.y = 1;
  camera.position.set(9, 9, 9);
  const mesh = sphere.getObjectByProperty('isMesh', true) as THREE.Mesh;
  const previous = mesh.material as THREE.Material;
  const disposePrevious = vi.spyOn(previous, 'dispose');
  loaderCalls.dispose.mockClear();
  scene.replaceMaterials(new ArrayBuffer(0), 'two.mtlx');
  expect(mesh.material).not.toBe(previous);
  expect(disposePrevious).toHaveBeenCalledOnce();
  expect(loaderCalls.dispose).toHaveBeenCalledOnce();
  expect(scene.activeMaterial).toBe('sample');
  expect(scene.geometry).toBe('sphere');
  expect(sphere.visible).toBe(true);
  expect(sphere.rotation.y).toBe(1);
  expect(camera.position.x).toBe(9);
  // A document without the selected material falls back to its last one.
  scene.setMaterial('other');
  scene.replaceMaterials(new ArrayBuffer(0), 'one.mtlx');
  expect(scene.activeMaterial).toBe('sample');
  expect(scene.materialNames).toEqual(['sample']);
  // A failed parse keeps the current material.
  const current = mesh.material;
  expect(() => scene.replaceMaterials(new ArrayBuffer(0), 'empty.mtlx')).toThrow('No materials');
  expect(mesh.material).toBe(current);
  scene.dispose();
  expect((current as THREE.Material).dispose).toBeDefined();
});

it('keeps the partial material and forwards loader errors instead of throwing', async () => {
  const onTranslationMessage = vi.fn();
  const scene = await createMtlxScene(
    new THREE.PerspectiveCamera(),
    { target: new THREE.Vector3(), update: () => {} },
    {
      data: new ArrayBuffer(0),
      fileName: 'partial.mtlx',
      shaderBall: new ArrayBuffer(0),
      onTranslationMessage,
    },
  );
  expect(loaderCalls.parse).toHaveBeenLastCalledWith(expect.anything(), 'partial.mtlx', { throwOnErrors: false });
  expect(scene.materialNames).toEqual(['sample']);
  expect(onTranslationMessage.mock.calls.map(([entry]) => entry.severity)).toEqual(['error', 'warning']);
  expect(onTranslationMessage).toHaveBeenCalledWith({
    severity: 'error',
    message: 'Unsupported MaterialX node category "displacement" on "Displacement".',
  });
  scene.dispose();
});

const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;
it('flags documents that use time or frame nodes as animated, per parse', async () => {
  const scene = await createMtlxScene(
    new THREE.PerspectiveCamera(45, 1),
    { target: new THREE.Vector3(), update: vi.fn() },
    {
      data: bytes('<materialx><time name="t" type="float" /></materialx>'),
      fileName: 'a.mtlx',
      shaderBall: new ArrayBuffer(0),
    },
  );
  expect(scene.animated).toBe(true);
  scene.replaceMaterials(bytes('<materialx><image name="frames" file="framerange.png" /></materialx>'), 'a.mtlx');
  expect(scene.animated).toBe(false);
  scene.replaceMaterials(bytes('<materialx><frame name="f" type="float"/></materialx>'), 'a.mtlx');
  expect(scene.animated).toBe(true);
  scene.dispose();
});
