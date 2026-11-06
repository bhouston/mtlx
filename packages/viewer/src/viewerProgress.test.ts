// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import * as THREE from 'three/webgpu';
import { createViewer } from './viewer.js';
import { DEFAULT_VIEWER_SETTINGS } from './renderingSettings.js';
const mocks = vi.hoisted(() => ({
  createScene: vi.fn(),
  render: vi.fn(),
  capture: vi.fn(async () => new Blob(['image'])),
}));
vi.mock('./screenshot.js', () => ({ captureScreenshot: mocks.capture }));
vi.mock('./runtime.js', () => ({
  createViewerRenderer: async () => ({ domElement: document.createElement('canvas'), setAnimationLoop: vi.fn() }),
  applyViewerRenderingSettings: vi.fn(),
  observeViewerResize: vi.fn(),
}));
vi.mock('./environment.js', () => ({ createEnvironmentSwitcher: () => ({ set: async () => true, dispose: vi.fn() }) }));
vi.mock('./rendering.js', () => ({ createViewerRendering: () => ({ render: mocks.render, dispose: vi.fn() }) }));
vi.mock('./scene.js', () => ({ createMtlxScene: mocks.createScene }));
afterEach(() => vi.clearAllMocks());
it('keeps startup and replacement open until textures finish and their render succeeds', async () => {
  let manager!: THREE.LoadingManager;
  const scene = {
    root: new THREE.Group(),
    activeMaterial: 'Example',
    materialNames: ['Example'],
    geometry: 'totem',
    reframe: vi.fn(),
    dispose: vi.fn(),
    hasGeometry: () => true,
    setGeometry: vi.fn(),
    replaceMaterials: () => manager.itemStart('replacement.png'),
  };
  mocks.createScene.mockImplementationOnce(async (_camera, _controls, options) => {
    manager = options.manager;
    manager.itemStart('texture.png');
    return scene;
  });
  const onProgress = vi.fn();
  const onReport = vi.fn();
  const pending = createViewer({
    container: document.createElement('div'),
    data: new ArrayBuffer(0),
    shaderBall: new ArrayBuffer(0),
    fileName: 'example.mtlx',
    alt: 'Brushed copper',
    settings: DEFAULT_VIEWER_SETTINGS,
    loadEnvironment: async () => new THREE.Texture(),
    onProgress,
    onReport,
  });
  for (let i = 0; i < 15; i++) await Promise.resolve();
  expect(onProgress.mock.lastCall![0].totalProgress).toBeLessThan(1);
  expect(mocks.render).not.toHaveBeenCalled();
  manager.itemEnd('texture.png');
  const viewer = await pending;
  expect(mocks.render).toHaveBeenCalledOnce();
  const canvas = viewer.controls.domElement!;
  expect(canvas.getAttribute('aria-label')).toBe('Brushed copper');
  expect(canvas.tabIndex).toBe(0);
  expect(canvas.getAttribute('aria-description')).toContain('Arrow keys pan');
  viewer.setAlt('Polished copper');
  expect(canvas.getAttribute('aria-label')).toBe('Polished copper');
  expect(mocks.render).toHaveBeenCalledOnce();
  expect(onProgress.mock.lastCall![0].totalProgress).toBe(1);
  viewer.replaceMaterial(new ArrayBuffer(0), 'replacement.mtlx');
  expect(onReport.mock.lastCall![0].state).toBe('loading');
  expect(onProgress.mock.lastCall![0].totalProgress).toBeLessThan(1);
  const screenshot = viewer.toBlob();
  await Promise.resolve();
  expect(mocks.capture).not.toHaveBeenCalled();
  manager.itemEnd('replacement.png');
  await expect(screenshot).resolves.toBeInstanceOf(Blob);
  for (let i = 0; i < 5; i++) await Promise.resolve();
  expect(onReport.mock.lastCall![0].state).toBe('ready');
  expect(onProgress.mock.lastCall![0].totalProgress).toBe(1);
  const staleCapture = viewer.toBlob();
  const obsolete = expect(staleCapture).rejects.toThrow('changed');
  viewer.replaceMaterial(new ArrayBuffer(0), 'newer.mtlx');
  await obsolete;
  manager.itemEnd('replacement.png');
  for (let i = 0; i < 5; i++) await Promise.resolve();
  const oldSettingsCapture = viewer.toBlob();
  const changedSettings = expect(oldSettingsCapture).rejects.toThrow('changed');
  await viewer.setSettings({ ...DEFAULT_VIEWER_SETTINGS, exposure: 1 });
  await changedSettings;
  mocks.render.mockImplementationOnce(() => {
    throw new Error('Shader failed');
  });
  expect(() => viewer.replaceMaterial(new ArrayBuffer(0), 'broken.mtlx')).toThrow('Shader failed');
  expect(onReport.mock.lastCall![0].state).toBe('error');
  const notifications = onProgress.mock.calls.length;
  viewer.dispose();
  viewer.setAlt('Obsolete description');
  expect(canvas.getAttribute('aria-label')).toBe('Polished copper');
  await expect(viewer.toBlob()).rejects.toThrow('disposed');
  manager.itemEnd('replacement.png');
  expect(onProgress).toHaveBeenCalledTimes(notifications);
});

it(
  'rejects capture promptly when disposal interrupts both settings and texture loading',
  { timeout: 1000 },
  async () => {
    let manager!: THREE.LoadingManager;
    const scene = {
      root: new THREE.Group(),
      activeMaterial: 'Example',
      materialNames: ['Example'],
      geometry: 'totem',
      reframe: vi.fn(),
      dispose: vi.fn(),
      hasGeometry: () => true,
      setGeometry: vi.fn(),
      replaceMaterials: () => manager.itemStart('pending.png'),
    };
    mocks.createScene.mockImplementationOnce(async (_camera, _controls, options) => {
      manager = options.manager;
      return scene;
    });
    const viewer = await createViewer({
      container: document.createElement('div'),
      data: new ArrayBuffer(0),
      shaderBall: new ArrayBuffer(0),
      fileName: 'example.mtlx',
      settings: DEFAULT_VIEWER_SETTINGS,
      loadEnvironment: async () => new THREE.Texture(),
    });
    viewer.replaceMaterial(new ArrayBuffer(0), 'pending.mtlx');
    const settings = viewer.setSettings({ ...DEFAULT_VIEWER_SETTINGS, geometry: 'sphere' });
    for (let i = 0; i < 15; i++) await Promise.resolve();
    expect(scene.setGeometry).toHaveBeenCalledWith('sphere');
    const capture = viewer.toBlob();
    const rejected = expect(capture).rejects.toThrow('disposed');
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(mocks.capture).not.toHaveBeenCalled();
    viewer.dispose();
    await rejected;
    await settings;
    expect(mocks.capture).not.toHaveBeenCalled();
  },
);
