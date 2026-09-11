import { expect, it } from 'vitest';
import { readBoundedResponse } from './material-bytes';

it('enforces actual streamed size without a Content-Length', async () => {
  await expect(readBoundedResponse(new Response('too much data'), 4, new AbortController().signal)).rejects.toThrow(
    'download byte limit',
  );
});
it('rejects an oversized Content-Length without reading the stream', async () => {
  await expect(
    readBoundedResponse(new Response('x', { headers: { 'content-length': '100' } }), 4, new AbortController().signal),
  ).rejects.toThrow('download byte limit');
});

it('reports streamed bytes and omits misleading totals for compressed responses', async () => {
  for (const compressed of [false, true]) {
    const seen: Array<[number, number | undefined]> = [];
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2]));
          controller.enqueue(new Uint8Array([3, 4]));
          controller.close();
        },
      }),
      { headers: compressed ? { 'content-length': '3', 'content-encoding': 'gzip' } : { 'content-length': '4' } },
    );
    await readBoundedResponse(response, 10, new AbortController().signal, (loaded, total) =>
      seen.push([loaded, total]),
    );
    expect(seen).toEqual([
      [2, compressed ? undefined : 4],
      [4, compressed ? undefined : 4],
    ]);
  }
});
