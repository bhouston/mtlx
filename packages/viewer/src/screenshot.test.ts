import { expect, it, vi } from 'vitest';
import { PerspectiveCamera, Scene, Texture, Vector2, Vector4, type WebGPURenderer } from 'three/webgpu';
import { captureScreenshot, screenshotAbortable, screenshotPixels, screenshotSize } from './screenshot.js';

it('uses exact output pixels and preserves aspect when one dimension is omitted', () => {
  expect(screenshotSize({}, 1200, 600)).toEqual({ width: 1200, height: 600 });
  expect(screenshotSize({ width: 400 }, 1200, 600)).toEqual({ width: 400, height: 200 });
  expect(screenshotSize({ height: 300 }, 1200, 600)).toEqual({ width: 600, height: 300 });
  expect(screenshotSize({ width: 400, height: 300 }, 1200, 600)).toEqual({ width: 400, height: 300 });
  for (const width of [0, -1, 1.5, NaN, Infinity, 8193]) expect(() => screenshotSize({ width }, 100, 100)).toThrow();
  expect(() => screenshotSize({ width: 8192, height: 8192 }, 100, 100)).toThrow();
  expect(() => screenshotSize({ quality: NaN }, 100, 100)).toThrow();
  expect(() => screenshotSize({ quality: 1.1 }, 100, 100)).toThrow();
});

it('normalizes asymmetric backend rows, transparent coverage, and white compositing', () => {
  const bytes = new Uint8Array([128, 0, 0, 128, 0, 0, 255, 255]);
  expect([...screenshotPixels(bytes, 1, 2, false, false)]).toEqual([255, 0, 0, 128, 0, 0, 255, 255]);
  expect([...screenshotPixels(bytes, 1, 2, true, true)]).toEqual([0, 0, 255, 255, 255, 127, 127, 255]);
  expect([...screenshotPixels(new Uint8Array([0, 0, 0, 0]), 1, 1, false, true)]).toEqual([255, 255, 255, 255]);
});

it('cancels a pending GPU readback without waiting indefinitely', async () => {
  const abort = new AbortController();
  const result = screenshotAbortable(new Promise(() => {}), abort.signal);
  abort.abort();
  await expect(result).rejects.toThrow('cancelled');
});

it('restores camera, renderer and backdrop synchronously, including when GPU readback fails', async () => {
  const scene = new Scene();
  scene.environment = new Texture();
  const camera = new PerspectiveCamera(40, 2);
  const originalProjection = camera.projectionMatrix.clone();
  let finish!: (value: Uint8Array) => void;
  const renderer = {
    getDrawingBufferSize: (size: Vector2) => size.set(1200, 600),
    getSize: (size: Vector2) => size.set(600, 300),
    getPixelRatio: () => 2,
    getRenderTarget: () => null,
    getViewport: (viewport: Vector4) => viewport.set(2, 3, 600, 300),
    getScissor: (scissor: Vector4) => scissor.set(0, 0, 600, 300),
    getScissorTest: () => false,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    setRenderTarget: vi.fn(),
    setViewport: vi.fn(),
    setScissor: vi.fn(),
    setScissorTest: vi.fn(),
    readRenderTargetPixelsAsync: () =>
      new Promise<Uint8Array>((resolve) => {
        finish = resolve;
      }),
  };
  const assertCurrent = vi.fn();
  const capture = captureScreenshot(
    renderer as unknown as WebGPURenderer,
    scene,
    camera,
    () => {
      expect(camera.aspect).toBe(1);
      expect(scene.background).toBe(scene.environment);
    },
    { width: 400, height: 400, background: 'environment' },
    'white',
    assertCurrent,
    new AbortController().signal,
  );
  expect(camera.aspect).toBe(2);
  expect(camera.projectionMatrix.equals(originalProjection)).toBe(true);
  expect(scene.background).toBeNull();
  expect(renderer.setSize).toHaveBeenLastCalledWith(600, 300, false);
  expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(2);
  expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(null);
  assertCurrent.mockImplementation(() => {
    throw new Error('Source changed');
  });
  finish(new Uint8Array(400 * 400 * 4));
  await expect(capture).rejects.toThrow('Source changed');
});
