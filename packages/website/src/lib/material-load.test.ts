import { afterEach, expect, it, vi } from 'vitest';
import { loadMaterial, MaterialLoadError } from './material-load';

const xml = '<materialx version="1.39"/>';
afterEach(() => vi.unstubAllGlobals());

it('uses the same bytes for preview and analysis and stops progress after cancellation', async () => {
  let finish!: (value: Response) => void;
  const old = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetcher = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce(new Response(xml));
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  const oldProgress = vi.fn();
  const pending = loadMaterial({ url: 'https://example.com/a.mtlx', name: 'a.mtlx' }, controller.signal, oldProgress);
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  const count = oldProgress.mock.calls.length;
  controller.abort();
  const result = await loadMaterial(
    { url: 'https://example.com/b.mtlx', name: 'b.mtlx' },
    new AbortController().signal,
  );
  finish(new Response(xml));
  await rejected;
  expect(oldProgress).toHaveBeenCalledTimes(count);
  expect(result.fileMeta.name).toBe('b.mtlx');
  expect(result.source.name).toBe('https://example.com/b.mtlx');
  expect(new TextDecoder().decode(result.source.data)).toBe(xml);
  expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(true);
});

it('rejects HTTP errors rather than treating an error page as a material', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })));
  await expect(
    loadMaterial({ url: 'https://example.com/missing.mtlx', name: 'missing.mtlx' }, new AbortController().signal),
  ).rejects.toThrow('HTTP 404');
});

it('reports cancellation instead of stale file read failures', async () => {
  let reject!: (error: Error) => void;
  const input = {
    name: 'old.mtlx',
    arrayBuffer: () =>
      new Promise<ArrayBuffer>((_, fail) => {
        reject = fail;
      }),
  } as File;
  const controller = new AbortController();
  const pending = loadMaterial(input, controller.signal);
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  reject(new Error('read failed'));
  await rejected;
});

it('rejects oversized and unsupported local files before reading bytes', async () => {
  const arrayBuffer = vi.fn();
  const file = { name: 'huge.mtlx', size: 17 * 1024 * 1024, arrayBuffer } as unknown as File;
  await expect(loadMaterial(file, new AbortController().signal)).rejects.toThrow('file byte limit');
  await expect(loadMaterial({ ...file, name: 'wrong.txt' } as File, new AbortController().signal)).rejects.toThrow(
    'Unsupported file type',
  );
  expect(arrayBuffer).not.toHaveBeenCalled();
});

it('reports download and analysis stages before returning the material', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(xml, { headers: { 'content-length': String(xml.length) } })),
  );
  const stages: string[] = [];
  await loadMaterial({ url: 'https://example.com/a.mtlx', name: 'a.mtlx' }, new AbortController().signal, (progress) =>
    stages.push(`${progress.value}: ${progress.label}`),
  );
  expect(stages).toEqual([
    '5: Downloading material…',
    '60: Downloading material… (1 KB)',
    '65: Checking material and resources…',
    '80: Preparing preview…',
  ]);
});

it('preserves parse diagnostics so the failed XML check can be displayed', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<broken>')));
  await expect(
    loadMaterial({ url: 'https://example.com/broken.mtlx', name: 'broken.mtlx' }, new AbortController().signal),
  ).rejects.toMatchObject({ name: 'MaterialLoadError', analysis: { parseError: expect.any(String) } });
  expect(new MaterialLoadError('invalid')).toBeInstanceOf(Error);
});
