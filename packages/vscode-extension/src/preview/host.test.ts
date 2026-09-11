import { afterEach, expect, it, vi } from 'vitest';
import { requestAsset, receiveAsset } from './host';

const asset = { source: 'ibl.hdr', data: new ArrayBuffer(4), resources: [] };
afterEach(() => vi.useRealTimers());
it('routes out-of-order asset replies by request id and ignores duplicate replies', async () => {
  const a = requestAsset('ibl', 'a', new AbortController().signal);
  const b = requestAsset('ibl', 'b', new AbortController().signal);
  receiveAsset({ ...asset, requestId: 2 });
  receiveAsset({ ...asset, source: 'a.hdr', requestId: 1 });
  expect((await a).source).toBe('a.hdr');
  expect((await b).source).toBe('ibl.hdr');
  expect(() => receiveAsset({ ...asset, requestId: 2 })).not.toThrow();
});
it('cancels pending asset requests and ignores their late replies', async () => {
  const controller = new AbortController();
  const pending = requestAsset('geometry', 'bust', controller.signal);
  const rejected = expect(pending).rejects.toThrow('cancelled');
  controller.abort();
  await rejected;
  expect(() => receiveAsset({ ...asset, requestId: 3 })).not.toThrow();
});
it('times out unanswered requests', async () => {
  vi.useFakeTimers();
  const pending = requestAsset('ibl', 'missing', new AbortController().signal);
  const rejected = expect(pending).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(120_000);
  await rejected;
});
