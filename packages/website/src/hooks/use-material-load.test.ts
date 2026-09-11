import { act, createElement, useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMaterialLoad } from './use-material-load';
import { loadMaterial, MaterialLoadError, type LoadedMaterial } from '../lib/material-load';

vi.mock('../lib/material-load', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/material-load')>()),
  loadMaterial: vi.fn(),
}));

let root: Root;
let client: QueryClient;
let hook: ReturnType<typeof useMaterialLoad>;
let container: HTMLDivElement;
const mockedLoad = vi.mocked(loadMaterial);
const result = (name: string) =>
  ({
    source: { kind: 'buffer', name, data: new ArrayBuffer(4) },
    fileMeta: { name, size: 4 },
    analysis: { issues: [] },
  }) as LoadedMaterial;
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mockedLoad.mockReset();
  client = new QueryClient();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  function Harness() {
    const value = useMaterialLoad();
    useLayoutEffect(() => {
      hook = value;
    });
    return null;
  }
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(Harness))));
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  onlineManager.setOnline(true);
  vi.unstubAllGlobals();
});

it('aborts superseded loads and ignores their late results and errors', async () => {
  let resolveOld!: (value: LoadedMaterial) => void;
  mockedLoad.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  mockedLoad.mockResolvedValueOnce(result('new.mtlx'));
  await act(async () => hook.load('https://example.com/old.mtlx'));
  const oldSignal = mockedLoad.mock.calls[0]![1];
  await act(async () => hook.load('https://example.com/new.mtlx'));
  await flush();
  expect(oldSignal.aborted).toBe(true);
  expect(hook.fileMeta?.name).toBe('new.mtlx');
  await act(async () => resolveOld(result('old.mtlx')));
  await flush();
  expect(hook.fileMeta?.name).toBe('new.mtlx');
  expect(hook.logLines.join('\n')).not.toContain('old.mtlx');

  let rejectOld!: (error: Error) => void;
  mockedLoad.mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectOld = reject;
      }),
  );
  mockedLoad.mockResolvedValueOnce(result('latest.mtlx'));
  await act(async () => hook.load('https://example.com/stale.mtlx'));
  await act(async () => hook.load('https://example.com/latest.mtlx'));
  await act(async () => rejectOld(new MaterialLoadError('stale failure')));
  await flush();
  expect(hook.fileMeta?.name).toBe('latest.mtlx');
  expect(hook.fileError).toBeNull();
  expect(hook.logLines.join('\n')).not.toContain('stale failure');
});

it('clears previous material state while pending and preserves failure diagnostics', async () => {
  mockedLoad.mockResolvedValueOnce(result('good.mtlx'));
  await act(async () => hook.load('https://example.com/good.mtlx'));
  await flush();
  await act(async () => hook.appendLog('Renderer ready.'));
  let reject!: (error: Error) => void;
  mockedLoad.mockImplementationOnce((_input, _signal, progress) => {
    progress?.({ value: 65, label: 'Checking material…' });
    return new Promise((_, fail) => {
      reject = fail;
    });
  });
  await act(async () => hook.load('https://example.com/broken.mtlx'));
  await flush();
  expect(hook.source).toBeNull();
  expect(hook.fileMeta).toBeUndefined();
  expect(hook.analysis).toBeUndefined();
  expect(hook.loadProgress?.value).toBe(65);
  expect(hook.logLines).not.toContain('Renderer ready.');
  const analysis = { issues: [], parseError: 'Invalid XML' } as unknown as LoadedMaterial['analysis'];
  await act(async () => reject(new MaterialLoadError('Invalid XML', analysis)));
  await flush();
  expect(hook.fileError).toBe('Invalid XML');
  expect(hook.analysis?.parseError).toBe('Invalid XML');
  expect(hook.loadProgress).toBeNull();
});

it('clear aborts pending work and late completion cannot restore the material', async () => {
  let resolve!: (value: LoadedMaterial) => void;
  mockedLoad.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await act(async () => hook.load('https://example.com/pending.mtlx'));
  const signal = mockedLoad.mock.calls[0]![1];
  await act(async () => hook.clear());
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(result('pending.mtlx')));
  await flush();
  expect(hook.source).toBeNull();
  expect(hook.logLines).toEqual([]);
  expect(hook.isPending).toBe(false);
});

it('loads local files offline and aborts work on unmount', async () => {
  onlineManager.setOnline(false);
  mockedLoad.mockImplementationOnce(() => new Promise(() => {}));
  await act(async () => hook.load(new File(['<materialx/>'], 'local.mtlx')));
  expect(mockedLoad).toHaveBeenCalledOnce();
  const signal = mockedLoad.mock.calls[0]![1];
  await act(async () => root.unmount());
  expect(signal.aborted).toBe(true);
});
