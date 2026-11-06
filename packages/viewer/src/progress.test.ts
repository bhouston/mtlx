import { afterEach, expect, it, vi } from 'vitest';
import { readMaterialResponse } from './progress.js';

afterEach(() => vi.useRealTimers());

function download(headers?: HeadersInit) {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
    },
  });
  const callback = vi.fn();
  const abort = new AbortController();
  const result = readMaterialResponse(new Response(body, { headers }), abort.signal, callback);
  return { stream, callback, abort, result };
}

it('reports the size initially, samples at 250 ms even when stalled, and completes once', async () => {
  vi.useFakeTimers();
  const { stream, callback, result } = download({ 'content-length': '10' });
  expect(callback).toHaveBeenLastCalledWith({ loaded: 0, total: 10, progress: 0 });
  stream.enqueue(new Uint8Array([1, 2, 3, 4]));
  await vi.advanceTimersByTimeAsync(249);
  expect(callback).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(callback).toHaveBeenLastCalledWith({ loaded: 4, total: 10, progress: 0.4 });
  await vi.advanceTimersByTimeAsync(250);
  expect(callback).toHaveBeenCalledTimes(3);
  stream.enqueue(new Uint8Array([5, 6, 7, 8, 9, 10]));
  stream.close();
  expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  expect(callback).toHaveBeenLastCalledWith({ loaded: 10, total: 10, progress: 1 });
  await vi.advanceTimersByTimeAsync(1000);
  expect(callback).toHaveBeenCalledTimes(4);
});

it.each<HeadersInit>([{}, { 'content-length': 'invalid' }, { 'content-length': '1', 'content-encoding': 'gzip' }])(
  'reports unknown totals honestly and resolves the size on completion (%j)',
  async (headers) => {
    const { stream, callback, result } = download(headers);
    expect(callback).toHaveBeenLastCalledWith({ loaded: 0, total: null, progress: null });
    stream.enqueue(new Uint8Array(3));
    stream.close();
    await result;
    expect(callback).toHaveBeenLastCalledWith({ loaded: 3, total: 3, progress: 1 });
  },
);

it('completes empty files', async () => {
  const { stream, callback, result } = download({ 'content-length': '0' });
  stream.close();
  await result;
  expect(callback).toHaveBeenLastCalledWith({ loaded: 0, total: 0, progress: 1 });
});

it('stops without reporting success when a stream fails', async () => {
  vi.useFakeTimers();
  const { stream, callback, result } = download();
  stream.error(new Error('Connection lost'));
  await expect(result).rejects.toThrow('Connection lost');
  await vi.advanceTimersByTimeAsync(1000);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('stops immediately and cancels the reader on abort', async () => {
  vi.useFakeTimers();
  const { callback, abort, result } = download();
  abort.abort();
  await expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(1000);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
