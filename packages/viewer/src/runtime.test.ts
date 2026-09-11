import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { CleanupScope } from './lifecycle';
import { createViewerRenderer, observeViewerResize, applyViewerRenderingSettings } from './runtime';
import type { PerspectiveCamera } from 'three/webgpu';

const mock = vi.hoisted(() => ({
  init: vi.fn(),
  dispose: vi.fn(),
  setAnimationLoop: vi.fn(),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  remove: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock('three/webgpu', () => ({
  NeutralToneMapping: 'neutral',
  SRGBColorSpace: 'srgb',
  WebGPURenderer: class {
    init = mock.init;
    dispose = mock.dispose;
    setAnimationLoop = mock.setAnimationLoop;
    setSize = mock.setSize;
    setPixelRatio = mock.setPixelRatio;
    domElement = { remove: mock.remove };
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mock.init.mockResolvedValue(undefined);
  vi.stubGlobal('window', { devicePixelRatio: 3 });
});
afterEach(() => vi.unstubAllGlobals());
it('preserves host sizing policy and owns the renderer during asynchronous initialization', async () => {
  let finish!: () => void;
  mock.init.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const scope = new CleanupScope();
  const pending = createViewerRenderer(scope, { width: 640, height: 480 });
  expect(mock.setSize).toHaveBeenCalledWith(640, 480, true);
  expect(mock.setPixelRatio).toHaveBeenCalledWith(2);
  scope.dispose();
  finish();
  await pending;
  scope.dispose();
  expect(mock.dispose).toHaveBeenCalledOnce();
  expect(mock.remove).toHaveBeenCalledOnce();
  const external = new CleanupScope();
  await createViewerRenderer(external, {
    width: 320,
    height: 240,
    canvas: {} as HTMLCanvasElement,
    updateStyle: false,
  });
  external.dispose();
  expect(mock.setSize).toHaveBeenLastCalledWith(320, 240, false);
  expect(mock.remove).toHaveBeenCalledOnce();
});
it('updates the camera and backing buffer when the host resizes and disconnects on disposal', async () => {
  let resized!: () => void;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe() {}
      disconnect = mock.disconnect;
    },
  );
  const scope = new CleanupScope();
  const renderer = await createViewerRenderer(scope, { width: 400, height: 400 });
  const camera = { aspect: 1, updateProjectionMatrix: vi.fn() };
  observeViewerResize(
    scope,
    { clientWidth: 800, clientHeight: 400 } as HTMLElement,
    renderer,
    camera as unknown as PerspectiveCamera,
    false,
  );
  resized();
  expect(camera.aspect).toBe(2);
  expect(camera.updateProjectionMatrix).toHaveBeenCalledOnce();
  expect(mock.setSize).toHaveBeenLastCalledWith(800, 400, false);
  scope.dispose();
  expect(mock.disconnect).toHaveBeenCalledOnce();
});
it('applies exposure in EV and environment intensity consistently', () => {
  const renderer = { toneMappingExposure: 1 };
  const scene = { environmentIntensity: 1 };
  const rendering = { configure: vi.fn() };
  applyViewerRenderingSettings(renderer, scene, rendering, {
    exposure: -1,
    intensity: 0.7,
    bloom: false,
    ao: true,
    toneMapping: 'agx',
  });
  expect(renderer.toneMappingExposure).toBe(0.5);
  expect(scene.environmentIntensity).toBe(0.7);
  expect(rendering.configure).toHaveBeenCalledWith(
    expect.objectContaining({ bloom: false, ao: true, toneMapping: 'agx' }),
  );
});
