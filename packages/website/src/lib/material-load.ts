import { analyzeInWorker } from './analyze-in-worker';
import { materialByteLimit, readBoundedResponse } from './material-bytes';
import type { MaterialXAnalysis } from './validate';

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
  ): Promise<void> {
    this.cancel();
    const generation = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    try {
      let data: ArrayBuffer;
      let resourceName: string;
      if ('url' in input) {
        const response = await fetch(input.url, { signal: abort.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status} loading ${input.url}`);
        data = await readBoundedResponse(response, materialByteLimit(input.name), abort.signal);
        resourceName = response.url || input.url;
      } else {
        const limit = materialByteLimit(input.name);
        if (input.size > limit) throw new Error(`Material exceeds file byte limit (${limit})`);
        data = await input.arrayBuffer();
        resourceName = input.name;
      }
      if (generation !== this.generation) return;
      const result = await analyzeInWorker(data, input.name, abort.signal, 'url' in input ? resourceName : undefined);
      if (generation !== this.generation) return;
      data = result.data;
      const analysis = result.analysis;
      if (analysis.parseError) throw new Error(analysis.parseError);
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
