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
