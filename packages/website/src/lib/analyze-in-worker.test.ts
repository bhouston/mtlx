import { afterEach, expect, it, vi } from 'vitest';
import { analyzeInWorker } from './analyze-in-worker';

afterEach(() => vi.unstubAllGlobals());
it('terminates background analysis when its request is cancelled', async () => {
  const terminate = vi.fn();
  vi.stubGlobal(
    'Worker',
    class {
      terminate = terminate;
      postMessage = vi.fn();
      addEventListener = vi.fn();
    },
  );
  const abort = new AbortController();
  const pending = analyzeInWorker(new ArrayBuffer(8), 'file.mtlx', abort.signal);
  abort.abort();
  await expect(pending).rejects.toThrow();
  expect(terminate).toHaveBeenCalledTimes(1);
});
it('reports a small-file fallback and rejects large files when workers are unavailable', async () => {
  vi.stubGlobal('Worker', undefined);
  const result = await analyzeInWorker(
    new TextEncoder().encode('<materialx version="1.39"/>').buffer,
    'file.mtlx',
    new AbortController().signal,
  );
  expect(result.analysis.issues).toContainEqual(expect.objectContaining({ code: 'WORKER_UNAVAILABLE' }));
  await expect(
    analyzeInWorker(new ArrayBuffer(1024 * 1024 + 1), 'large.mtlx', new AbortController().signal),
  ).rejects.toThrow('Background analysis is unavailable');
});
