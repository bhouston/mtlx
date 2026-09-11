import type { MaterialXAnalysis } from './validate';
import { analyzeBytes } from './material-analysis';

export interface MaterialAnalysisResult {
  data: ArrayBuffer;
  analysis: MaterialXAnalysis;
}
const SMALL_FALLBACK_BYTES = 1024 * 1024;

/** Large documents require a worker; a small-document fallback is reported as a warning. */
export async function analyzeInWorker(
  data: ArrayBuffer,
  name: string,
  signal: AbortSignal,
): Promise<MaterialAnalysisResult> {
  signal.throwIfAborted();
  let worker: Worker;
  try {
    worker = new Worker(new URL('./material-analysis.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    const bytes = new Uint8Array(data);
    const archive = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (archive || data.byteLength > SMALL_FALLBACK_BYTES)
      throw new Error(
        'Background analysis is unavailable; this browser can only analyze plain XML files up to 1 MiB without a worker.',
      );
    const analysis = analyzeBytes(data, name);
    analysis.issues.push({
      level: 'warning',
      code: 'WORKER_UNAVAILABLE',
      location: name,
      message: 'Background analysis unavailable; this small document was analyzed on the main thread.',
    });
    return { data, analysis };
  }
  return new Promise((resolve, reject) => {
    const finish = () => {
      worker.terminate();
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      finish();
      reject(signal.reason ?? new Error('Material analysis cancelled'));
    };
    signal.addEventListener('abort', abort, { once: true });
    worker.addEventListener('message', (event: MessageEvent<MaterialAnalysisResult & { error?: string }>) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    });
    worker.addEventListener('messageerror', () => {
      finish();
      reject(new Error('Background material analysis returned an unreadable response'));
    });
    worker.addEventListener('error', (event) => {
      event.preventDefault();
      finish();
      reject(new Error(`Background material analysis failed: ${event.message || 'worker could not load'}`));
    });
    try {
      worker.postMessage({ data, name }, [data]);
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
