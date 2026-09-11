import { expect, it, vi } from 'vitest';
import { collectDisposables } from './disposal';

it('disposes shared geometries, overwritten materials and textures inside cyclic shader nodes once', () => {
  const texture = { isTexture: true, dispose: vi.fn() };
  const shader: Record<string, unknown> = { value: texture };
  shader.self = shader;
  const material = { isMaterial: true, colorNode: shader, dispose: vi.fn() };
  const geometry = { isBufferGeometry: true, dispose: vi.fn() };
  const mesh = { geometry, material };
  const dispose = collectDisposables([mesh, { geometry, material }]);
  mesh.material = { ...material, dispose: vi.fn() };
  dispose();
  dispose();
  expect(geometry.dispose).toHaveBeenCalledTimes(1);
  expect(material.dispose).toHaveBeenCalledTimes(1);
  expect(texture.dispose).toHaveBeenCalledTimes(1);
  expect(mesh.material.dispose).not.toHaveBeenCalled();
});
