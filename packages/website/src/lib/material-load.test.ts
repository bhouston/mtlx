import { afterEach, expect, it, vi } from 'vitest';
import { MaterialLoadController } from './material-load';

const xml = '<materialx version="1.39"/>';
afterEach(() => vi.unstubAllGlobals());
it('commits only the latest request and uses the same bytes for preview and analysis', async () => {
  let finish!: (value: Response) => void;
  const old = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetcher = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce(new Response(xml));
  vi.stubGlobal('fetch', fetcher);
  const controller = new MaterialLoadController();
  const commit = vi.fn();
  const fail = vi.fn();
  const oldProgress = vi.fn();
  const a = controller.load({ url: 'https://example.com/a.mtlx', name: 'a.mtlx' }, commit, fail, oldProgress);
  const oldProgressCount = oldProgress.mock.calls.length;
  await controller.load({ url: 'https://example.com/b.mtlx', name: 'b.mtlx' }, commit, fail);
  finish(new Response(xml));
  await a;
  expect(oldProgress).toHaveBeenCalledTimes(oldProgressCount);
  expect(commit).toHaveBeenCalledTimes(1);
  const result = commit.mock.calls[0]![0];
  expect(result.fileMeta.name).toBe('b.mtlx');
  expect(result.source.name).toBe('https://example.com/b.mtlx');
  expect(new TextDecoder().decode(result.source.data)).toBe(xml);
  expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(true);
  expect(fail).not.toHaveBeenCalled();
});
it('reports HTTP failures without committing an error page as a material', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })));
  const commit = vi.fn();
  const fail = vi.fn();
  await new MaterialLoadController().load(
    { url: 'https://example.com/missing.mtlx', name: 'missing.mtlx' },
    commit,
    fail,
  );
  expect(commit).not.toHaveBeenCalled();
  expect(fail).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'));
});
it('suppresses results and errors from cancelled file reads', async () => {
  let reject!: (error: Error) => void;
  const input = {
    name: 'old.mtlx',
    arrayBuffer: () =>
      new Promise<ArrayBuffer>((_, fail) => {
        reject = fail;
      }),
  } as File;
  const controller = new MaterialLoadController();
  const commit = vi.fn();
  const fail = vi.fn();
  const pending = controller.load(input, commit, fail);
  controller.cancel();
  reject(new Error('read failed'));
  await pending;
  expect(commit).not.toHaveBeenCalled();
  expect(fail).not.toHaveBeenCalled();
});
it('rejects oversized local files before reading their bytes', async () => {
  const arrayBuffer = vi.fn();
  const file = { name: 'huge.mtlx', size: 17 * 1024 * 1024, arrayBuffer } as unknown as File;
  const fail = vi.fn();
  await new MaterialLoadController().load(file, vi.fn(), fail);
  expect(arrayBuffer).not.toHaveBeenCalled();
  expect(fail).toHaveBeenCalledWith(expect.stringContaining('file byte limit'));
});

it('reports download and analysis stages before committing a material', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(xml, { headers: { 'content-length': String(xml.length) } })),
  );
  const stages: string[] = [];
  await new MaterialLoadController().load(
    { url: 'https://example.com/a.mtlx', name: 'a.mtlx' },
    () => stages.push('committed'),
    vi.fn(),
    (progress) => stages.push(`${progress.value}: ${progress.label}`),
  );
  expect(stages).toEqual([
    '5: Downloading material…',
    '60: Downloading material… (1 KB)',
    '65: Checking material and resources…',
    '80: Preparing preview…',
    'committed',
  ]);
});

it('preserves parse diagnostics so the failed XML check can be displayed', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<broken>')));
  const fail = vi.fn();
  const commit = vi.fn();
  await new MaterialLoadController().load(
    { url: 'https://example.com/broken.mtlx', name: 'broken.mtlx' },
    commit,
    fail,
  );
  expect(commit).not.toHaveBeenCalled();
  expect(fail).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ parseError: expect.any(String) }));
});
