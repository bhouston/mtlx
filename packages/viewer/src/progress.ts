/** Download progress for the material file, excluding preview assets and rendering setup. */
export interface MaterialProgress {
  loaded: number;
  /** File size in bytes, or null when the server does not provide a usable Content-Length. */
  total: number | null;
  /** Fraction from 0 to 1, or null while the file size is unknown. */
  progress: number | null;
}

/** Read a material response, reporting immediately, every 250 ms, and on completion. */
export async function readMaterialResponse(
  response: Response,
  signal: AbortSignal,
  onProgress: (progress: MaterialProgress) => void,
): Promise<ArrayBuffer> {
  signal.throwIfAborted();
  const length = response.headers.get('content-length');
  const size = length === null ? NaN : Number(length);
  // Fetch decodes compressed responses; their Content-Length describes different bytes.
  const encoding = response.headers.get('content-encoding');
  let total = Number.isSafeInteger(size) && size >= 0 && (!encoding || encoding === 'identity') ? size : null;
  let loaded = 0;
  const publish = () => {
    signal.throwIfAborted();
    onProgress({ loaded, total, progress: total ? Math.min(loaded / total, 1) : null });
  };
  publish();
  signal.throwIfAborted();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => clearInterval(timer);
  signal.addEventListener('abort', stop, { once: true });
  const reader = response.body?.getReader();
  const cancel = () => {
    void reader?.cancel().catch(() => {});
  };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    timer = setInterval(publish, 250);
    let data: ArrayBuffer;
    if (reader) {
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        signal.throwIfAborted();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
      }
      const bytes = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      data = bytes.buffer;
    } else {
      data = await response.arrayBuffer();
      loaded = data.byteLength;
    }
    signal.throwIfAborted();
    total = loaded;
    onProgress({ loaded, total, progress: 1 });
    return data;
  } finally {
    stop();
    signal.removeEventListener('abort', stop);
    signal.removeEventListener('abort', cancel);
    reader?.releaseLock();
  }
}
