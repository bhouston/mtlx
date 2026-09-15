import { expect, it, vi } from 'vitest';
import type { CleanupScope } from './lifecycle.js';
import { createViewer, type ViewerOptions } from './viewer.js';
const mock = vi.hoisted(() => ({ renderer: vi.fn() }));
vi.mock('./runtime.js', async (original) => ({
  ...(await original<typeof import('./runtime.js')>()),
  createViewerRenderer: mock.renderer,
}));
it('cancels and releases a replaced preview during renderer initialization', async () => {
  const dispose = vi.fn();
  let finish!: () => void;
  mock.renderer.mockImplementationOnce((scope: CleanupScope) => {
    scope.own(dispose);
    return new Promise((resolve) => {
      finish = () => resolve({});
    });
  });
  const abort = new AbortController();
  const loadEnvironment = vi.fn();
  const pending = createViewer({
    signal: abort.signal,
    container: { clientWidth: 300, clientHeight: 300 },
    settings: {},
    loadEnvironment,
  } as unknown as ViewerOptions);
  abort.abort();
  expect(dispose).toHaveBeenCalledOnce();
  finish();
  await expect(pending).rejects.toThrow('Viewer disposed');
  expect(loadEnvironment).not.toHaveBeenCalled();
  expect(dispose).toHaveBeenCalledOnce();
});
it('does not allocate a renderer when the request was already cancelled', async () => {
  mock.renderer.mockClear();
  await expect(createViewer({ signal: AbortSignal.abort(), settings: {} } as ViewerOptions)).rejects.toThrow();
  expect(mock.renderer).not.toHaveBeenCalled();
});
