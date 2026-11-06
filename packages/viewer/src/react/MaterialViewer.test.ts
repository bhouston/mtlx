// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('../element.js', () => ({}));
import { MaterialViewer } from './MaterialViewer.js';

beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));

const roots: ReturnType<typeof createRoot>[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

it('forwards progress, load, and string errors, uses updated callbacks, and clears src on cleanup', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  const onProgress = vi.fn();
  const onLoad = vi.fn();
  const onError = vi.fn();
  await act(async () => {
    root.render(createElement(MaterialViewer, { src: '/first.mtlx', onProgress, onLoad, onError }));
  });
  const element = host.querySelector('material-viewer')!;
  expect(element.getAttribute('src')).toBe('/first.mtlx');
  const detail = { loaded: 5, total: 10, progress: 0.5 };
  element.dispatchEvent(new CustomEvent('progress', { detail }));
  element.dispatchEvent(new Event('load'));
  element.dispatchEvent(new CustomEvent('error', { detail: 'Connection lost' }));
  expect(onProgress).toHaveBeenCalledWith(detail);
  expect(onLoad).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledWith('Connection lost');
  const updated = vi.fn();
  await act(async () => {
    root.render(createElement(MaterialViewer, { src: '/second.mtlx', onProgress: updated }));
  });
  expect(element.getAttribute('src')).toBe('/second.mtlx');
  element.dispatchEvent(new CustomEvent('progress', { detail }));
  expect(updated).toHaveBeenCalledWith(detail);
  expect(onProgress).toHaveBeenCalledOnce();
  await act(async () => root.render(null));
  expect(element.hasAttribute('src')).toBe(false);
  element.dispatchEvent(new CustomEvent('progress', { detail }));
  expect(updated).toHaveBeenCalledOnce();
});
