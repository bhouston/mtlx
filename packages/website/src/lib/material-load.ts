import { analyzeInWorker } from './analyze-in-worker';
import { materialByteLimit, readBoundedResponse } from './material-bytes';
import type { MaterialXAnalysis } from './material-analysis';

export interface MaterialLoadProgress {
  value: number;
  label: string;
}

export interface LoadedMaterial {
  source: { kind: 'buffer'; data: ArrayBuffer; name: string };
  fileMeta: { name: string; size: number };
  analysis: MaterialXAnalysis;
}

export type MaterialLoadInput = File | { url: string; name: string };

export class MaterialLoadError extends Error {
  constructor(
    message: string,
    public readonly analysis?: MaterialXAnalysis,
  ) {
    super(message);
    this.name = 'MaterialLoadError';
  }
}

/** Read and analyze the same bytes for inspection and preview. The caller owns cancellation. */
export async function loadMaterial(
  input: MaterialLoadInput,
  signal: AbortSignal,
  onProgress?: (progress: MaterialLoadProgress) => void,
): Promise<LoadedMaterial> {
  const progress = (value: number, label: string) => {
    signal.throwIfAborted();
    onProgress?.({ value, label });
  };
  try {
    signal.throwIfAborted();
    if (!('url' in input) && !/\.mtlx(\.zip)?$/i.test(input.name)) {
      throw new MaterialLoadError('Unsupported file type — drop a .mtlx or .mtlx.zip file.');
    }
    progress(5, 'url' in input ? 'Downloading material…' : 'Reading material…');
    let data: ArrayBuffer;
    let resourceName: string;
    if ('url' in input) {
      const response = await fetch(input.url, { signal });
      signal.throwIfAborted();
      if (!response.ok) throw new Error(`HTTP ${response.status} loading ${input.url}`);
      data = await readBoundedResponse(response, materialByteLimit(input.name), signal, (loaded, total) => {
        progress(
          total ? 5 + 55 * Math.min(loaded / total, 1) : 10,
          `Downloading material… (${Math.ceil(loaded / 1024)} KB)`,
        );
      });
      resourceName = response.url || input.url;
    } else {
      const limit = materialByteLimit(input.name);
      if (input.size > limit) throw new Error(`Material exceeds file byte limit (${limit})`);
      data = await input.arrayBuffer();
      resourceName = input.name;
    }
    progress(65, 'Checking material and resources…');
    const result = await analyzeInWorker(data, input.name, signal, 'url' in input ? resourceName : undefined);
    signal.throwIfAborted();
    if (result.analysis.parseError) throw new MaterialLoadError(result.analysis.parseError, result.analysis);
    progress(80, 'Preparing preview…');
    return {
      source: { kind: 'buffer', data: result.data, name: resourceName },
      fileMeta: { name: input.name, size: result.data.byteLength },
      analysis: result.analysis,
    };
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof MaterialLoadError) throw error;
    throw new MaterialLoadError(error instanceof Error ? error.message : String(error));
  }
}
