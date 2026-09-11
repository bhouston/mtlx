import { DEFAULT_MATERIALX_READ_LIMITS } from 'mtlx-core';

export const materialByteLimit = (name: string): number =>
  /\.mtlx(?:[?#].*)?$/i.test(name)
    ? DEFAULT_MATERIALX_READ_LIMITS.maxXmlBytes
    : DEFAULT_MATERIALX_READ_LIMITS.maxArchiveBytes;

/** Enforces the actual streamed byte count even without a trustworthy Content-Length. */
export async function readBoundedResponse(
  response: Response,
  limit: number,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > limit) {
    await response.body?.cancel();
    throw new Error(`Material exceeds download byte limit (${limit})`);
  }
  if (!response.body) throw new Error('Material download has no readable body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    for (;;) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error(`Material exceeds download byte limit (${limit})`);
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes.buffer;
  } finally {
    signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
