import { expect, it, vi } from 'vitest';
import * as THREE from 'three/webgpu';
import { createMtlxScene } from './scene.js';
const loaderCalls = vi.hoisted(() => ({ parse: vi.fn(), dispose: vi.fn() }));
vi.mock('three/addons/loaders/MaterialXLoader.js', () => ({
  MaterialXLoader: class {
    dispose() {
      loaderCalls.dispose();
    }
    parseBuffer(data: ArrayBuffer, url: string) {
      loaderCalls.parse(data, url);
      return { materials: { sample: new THREE.MeshStandardMaterial() } };
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
  const data = new Uint8Array([0x50, 0x4b, 3, 4]).buffer;
  const scene = await createMtlxScene(
    new THREE.PerspectiveCamera(45, 1),
    { target: new THREE.Vector3(), update: vi.fn() },
    { data, fileName: 'https://example.com/materials/compound.mtlx.zip', shaderBall: new ArrayBuffer(0) },
  );
  expect(loaderCalls.parse).toHaveBeenCalledWith(data, '');
  expect(loaderCalls.dispose).not.toHaveBeenCalled();
  scene.dispose();
  scene.dispose();
  expect(loaderCalls.dispose).toHaveBeenCalledTimes(1);
});
