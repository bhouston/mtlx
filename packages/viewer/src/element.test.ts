// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ViewerOptions } from './viewer.js';
const mocks = vi.hoisted(() => ({ createViewer: vi.fn() }));
vi.mock('./viewer.js', () => ({ createViewer: mocks.createViewer }));
vi.mock('./environment.js', () => ({ parseEnvironmentFile: vi.fn() }));
import './element.js';

const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
let options: ViewerOptions;
const setSettings = vi.fn();
const dispose = vi.fn();
const setAlt = vi.fn();
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, headers: new Headers(), arrayBuffer: async () => new ArrayBuffer(0) })),
  );
  setSettings.mockResolvedValue(undefined);
  mocks.createViewer.mockImplementation(async (value: ViewerOptions) => {
    options = value;
    return {
      scene: { materialNames: ['Example'], activeMaterial: 'Example', animated: false },
      setSettings,
      setAlt,
      dispose,
    };
  });
});
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
function mount(silent = false) {
  const viewer = document.createElement('material-viewer');
  viewer.setAttribute('src', '/material.mtlx');
  if (silent) viewer.setAttribute('errors', 'silent');
  document.body.append(viewer);
  return viewer;
}
function overlay(viewer: HTMLElement) {
  return viewer.shadowRoot!.querySelector<HTMLDivElement>('.error-log')!;
}

it('shows HTTP failures by default and preserves string error events', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, status: 404 })),
  );
  const viewer = mount();
  const error = vi.fn();
  viewer.addEventListener('error', error);
  await flush();
  expect(overlay(viewer).hidden).toBe(false);
  expect(overlay(viewer).textContent).toContain('HTTP 404 loading /material.mtlx');
  expect(overlay(viewer).textContent).toContain('Source: /material.mtlx');
  expect(error.mock.calls[0]![0].detail).toBe('HTTP 404 loading /material.mtlx');
});

it('silences visible errors only and toggles visibility without reloading', async () => {
  mocks.createViewer.mockRejectedValueOnce(new Error('Invalid XML'));
  const viewer = mount(true);
  const error = vi.fn();
  viewer.addEventListener('error', error);
  await flush();
  expect(overlay(viewer).hidden).toBe(true);
  expect(error).toHaveBeenCalledOnce();
  viewer.removeAttribute('errors');
  expect(overlay(viewer).hidden).toBe(false);
  viewer.setAttribute('errors', 'silent');
  expect(overlay(viewer).hidden).toBe(true);
  viewer.setAttribute('errors', 'other');
  expect(overlay(viewer).hidden).toBe(false);
  expect(mocks.createViewer).toHaveBeenCalledOnce();
  expect(setSettings).not.toHaveBeenCalled();
  viewer.setAttribute('src', '/valid.mtlx');
  await flush();
  expect(overlay(viewer).hidden).toBe(true);
});

it('displays runtime and setting failures and ignores callbacks after source removal', async () => {
  const viewer = mount();
  await flush();
  options.onError?.('Shader compilation failed');
  expect(overlay(viewer).textContent).toContain('Shader compilation failed');
  expect(overlay(viewer).hidden).toBe(false);
  setSettings.mockRejectedValueOnce(new Error('Setting failed'));
  viewer.setAttribute('geometry', 'cube');
  await flush();
  expect(overlay(viewer).textContent).toContain('Setting failed');
  viewer.removeAttribute('src');
  await flush();
  expect(overlay(viewer).hidden).toBe(true);
  options.onError?.('Obsolete error');
  expect(overlay(viewer).hidden).toBe(true);
});

it('ignores rejected fetches from an obsolete source', async () => {
  let reject!: (error: Error) => void;
  const fetcher = vi.fn(async (url: string | URL) => {
    if (url === '/material.mtlx')
      return new Promise<never>((_resolve, fail) => {
        reject = fail;
      });
    return { ok: true, headers: new Headers(), arrayBuffer: async () => new ArrayBuffer(0) };
  });
  vi.stubGlobal('fetch', fetcher);
  const viewer = mount();
  viewer.removeAttribute('src');
  reject(new Error('Obsolete failure'));
  await flush();
  expect(overlay(viewer).hidden).toBe(true);
  expect(mocks.createViewer).not.toHaveBeenCalled();
});

it('emits material download progress independently of preview readiness', async () => {
  const response = new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-length': '3' } });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) =>
      url === '/material.mtlx' ? response : { ok: true, arrayBuffer: async () => new ArrayBuffer(0) },
    ),
  );
  const viewer = mount();
  const progress = vi.fn();
  viewer.addEventListener('progress', progress);
  await flush();
  expect(progress.mock.calls.map(([event]) => event.detail)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ loaded: 0, total: 3, progress: 0, totalProgress: 0 }),
      expect.objectContaining({ loaded: 3, total: 3, progress: 1, totalProgress: 0.3 }),
    ]),
  );
  expect(progress.mock.lastCall![0].detail.totalProgress).toBe(1);
});

it.each(['error', 'replace', 'disconnect'])('stops active progress on %s', async (action) => {
  vi.useFakeTimers();
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      if (url === '/material.mtlx') return new Response(body, { headers: { 'content-length': '10' } });
      if (action === 'error') throw new Error('Shaderball failed');
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
    }),
  );
  const viewer = mount();
  const progress = vi.fn();
  viewer.addEventListener('progress', progress);
  await flush();
  if (action === 'replace') viewer.removeAttribute('src');
  if (action === 'disconnect') viewer.remove();
  await flush();
  const count = progress.mock.calls.length;
  await vi.advanceTimersByTimeAsync(1000);
  expect(progress).toHaveBeenCalledTimes(count);
  expect(progress.mock.calls.every(([event]) => event.detail.progress !== 1)).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  expect(() => stream.enqueue(new Uint8Array(1))).toThrow();
  vi.useRealTimers();
});

it('shows automatically through setup, completes, and ignores stale progress after removal', async () => {
  let finish!: (value: unknown) => void;
  mocks.createViewer.mockImplementationOnce((value: ViewerOptions) => {
    options = value;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const viewer = mount();
  const root = viewer.shadowRoot!.querySelector<HTMLElement>('.mtlx-progress')!;
  expect(root.hidden).toBe(false);
  expect(viewer.getAttribute('aria-busy')).toBe('true');
  await flush();
  options.onProgress?.({ totalProgress: 0.5, reason: 'material-load' });
  expect(root.querySelector<HTMLElement>('[part="default-progress-bar"]')!.style.transform).toBe('scaleX(0.7)');
  finish({ scene: { materialNames: [], activeMaterial: '', animated: false }, setSettings, setAlt, dispose });
  await flush();
  expect(viewer.getAttribute('aria-busy')).toBe('false');
  expect(root.querySelector('.complete')).not.toBeNull();
  options.onProgress?.({ totalProgress: 0, reason: 'environment-update' });
  expect(viewer.getAttribute('aria-busy')).toBe('true');
  viewer.removeAttribute('src');
  expect(root.hidden).toBe(true);
  options.onProgress?.({ totalProgress: 0.5, reason: 'environment-update' });
  expect(root.hidden).toBe(true);
});

it('supports an empty replacement slot to disable the automatic bar', () => {
  const viewer = mount();
  const replacement = document.createElement('span');
  replacement.slot = 'progress-bar';
  viewer.append(replacement);
  const slot = viewer.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="progress-bar"]')!;
  expect(slot.assignedElements()).toEqual([replacement]);
});

it('applies validated camera attributes live without reloading the material or viewer', async () => {
  const viewer = mount();
  viewer.setAttribute('camera-orbit', '390deg 70deg 2m');
  viewer.setAttribute('camera-target', '.1m 0m 0m');
  viewer.setAttribute('field-of-view', '35deg');
  await flush();
  expect(options.settings).toMatchObject({
    cameraOrbit: '30deg 70deg 2m',
    cameraTarget: '0.1m 0m 0m',
    fieldOfView: 35,
  });
  setSettings.mockClear();
  viewer.setAttribute('camera-orbit', '60deg 80deg 3m');
  await flush();
  expect(mocks.createViewer).toHaveBeenCalledOnce();
  expect(setSettings).toHaveBeenLastCalledWith(expect.objectContaining({ cameraOrbit: '60deg 80deg 3m' }));
  const changed = vi.fn();
  viewer.addEventListener('camera-change', changed);
  options.onCameraChange?.({ cameraOrbit: '60deg 80deg 3m', cameraTarget: '0.1m 0m 0m', fieldOfView: 35 });
  expect(changed.mock.calls[0]![0].detail).toEqual({
    cameraOrbit: '60deg 80deg 3m',
    cameraTarget: '0.1m 0m 0m',
    fieldOfView: 35,
  });
  viewer.removeAttribute('camera-orbit');
  viewer.setAttribute('field-of-view', 'Infinity');
  await flush();
  expect(setSettings.mock.lastCall![0].cameraOrbit).toBeUndefined();
  expect(setSettings.mock.lastCall![0].fieldOfView).toBeUndefined();
});

it('updates environment yaw without reloading the material and normalizes attribute degrees', async () => {
  const viewer = mount();
  viewer.setAttribute('environment-rotation', '-90');
  await flush();
  expect(options.settings.environmentRotation).toBe(270);
  viewer.setAttribute('environment-rotation', '450');
  await flush();
  expect(setSettings).toHaveBeenLastCalledWith(expect.objectContaining({ environmentRotation: 90 }));
  expect(mocks.createViewer).toHaveBeenCalledOnce();
  viewer.setAttribute('environment-rotation', 'not-an-angle');
  await flush();
  expect(setSettings).toHaveBeenLastCalledWith(expect.objectContaining({ environmentRotation: 0 }));
});

it('forwards accessible descriptions and updates them without loading or settings work', async () => {
  const viewer = document.createElement('material-viewer');
  viewer.setAttribute('src', '/material.mtlx');
  viewer.setAttribute('alt', 'Brushed copper with fine horizontal grooves');
  document.body.append(viewer);
  await flush();
  expect(options.alt).toBe('Brushed copper with fine horizontal grooves');
  expect(setAlt).toHaveBeenLastCalledWith('Brushed copper with fine horizontal grooves');
  const downloads = vi.mocked(fetch).mock.calls.length;
  viewer.setAttribute('alt', 'Polished copper');
  expect(setAlt).toHaveBeenLastCalledWith('Polished copper');
  viewer.removeAttribute('alt');
  expect(setAlt).toHaveBeenLastCalledWith(undefined);
  expect(mocks.createViewer).toHaveBeenCalledOnce();
  expect(vi.mocked(fetch).mock.calls).toHaveLength(downloads);
  expect(setSettings).not.toHaveBeenCalled();
});

it('applies the latest description when alt changes during renderer initialization', async () => {
  let finish!: (value: unknown) => void;
  mocks.createViewer.mockImplementationOnce((value: ViewerOptions) => {
    options = value;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const viewer = mount();
  await flush();
  viewer.setAttribute('alt', 'Updated while loading');
  finish({ scene: { materialNames: [], activeMaterial: '', animated: false }, setSettings, setAlt, dispose });
  await flush();
  expect(setAlt).toHaveBeenLastCalledWith('Updated while loading');
  expect(mocks.createViewer).toHaveBeenCalledOnce();
  expect(dispose).not.toHaveBeenCalled();
  expect(setSettings).not.toHaveBeenCalled();
});
