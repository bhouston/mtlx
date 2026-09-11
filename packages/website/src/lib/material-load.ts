import { analyzeInWorker } from './analyze-in-worker';
import { materialByteLimit, readBoundedResponse } from './material-bytes';
import type { MaterialXAnalysis } from './validate';

export interface MaterialLoadProgress {
  value: number;
  label: string;
}

export interface LoadedMaterial {
  source: { kind: 'buffer'; data: ArrayBuffer; name: string };
  fileMeta: { name: string; size: number };
  analysis: MaterialXAnalysis;
}

/** One generation owns both the preview bytes and the analysis of those exact bytes. */
export class MaterialLoadController {
  private generation = 0;
  private abort?: AbortController;

  cancel(): void {
    this.generation++;
    this.abort?.abort();
  }

  async load(
    input: { url: string; name: string } | File,
    commit: (result: LoadedMaterial) => void,
    fail: (message: string) => void,
    onProgress?: (progress: MaterialLoadProgress) => void,
  ): Promise<void> {
    this.cancel();
    const generation = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    const progress = (value: number, label: string) => {
      if (generation === this.generation && !abort.signal.aborted) onProgress?.({ value, label });
    };
    progress(5, 'url' in input ? 'Downloading material…' : 'Reading material…');
    try {
      let data: ArrayBuffer;
      let resourceName: string;
      if ('url' in input) {
        const response = await fetch(input.url, { signal: abort.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status} loading ${input.url}`);
        data = await readBoundedResponse(response, materialByteLimit(input.name), abort.signal, (loaded, total) => {
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
      if (generation !== this.generation) return;
      progress(65, 'Checking material and resources…');
      const result = await analyzeInWorker(data, input.name, abort.signal, 'url' in input ? resourceName : undefined);
      if (generation !== this.generation) return;
      data = result.data;
      const analysis = result.analysis;
      if (analysis.parseError) throw new Error(analysis.parseError);
      progress(80, 'Preparing preview…');
      commit({
        source: { kind: 'buffer', data, name: resourceName },
        fileMeta: { name: input.name, size: data.byteLength },
        analysis,
      });
    } catch (error) {
      if (generation !== this.generation) return;
      fail(error instanceof Error ? error.message : String(error));
    }
  }
}
