import { extractMaterialXText } from './materialx-zip';
import { analyzeMaterialXText, type MaterialXAnalysis } from './validate';

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
        data = await response.arrayBuffer();
        resourceName = input.url;
      } else {
        data = await input.arrayBuffer();
        resourceName = input.name;
      }
      if (generation !== this.generation) return;
      const text = input.name.toLowerCase().endsWith('.mtlx.zip')
        ? extractMaterialXText(data)
        : new TextDecoder().decode(data);
      const analysis = analyzeMaterialXText(input.name, text);
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
