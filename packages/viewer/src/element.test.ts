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
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })),
  );
  setSettings.mockResolvedValue(undefined);
  mocks.createViewer.mockImplementation(async (value: ViewerOptions) => {
    options = value;
    return { scene: { materialNames: ['Example'], activeMaterial: 'Example', animated: false }, setSettings, dispose };
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
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
  });
  vi.stubGlobal('fetch', fetcher);
  const viewer = mount();
  viewer.removeAttribute('src');
  reject(new Error('Obsolete failure'));
  await flush();
  expect(overlay(viewer).hidden).toBe(true);
  expect(mocks.createViewer).not.toHaveBeenCalled();
});
