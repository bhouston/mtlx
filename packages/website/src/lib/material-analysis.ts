import { inspectMaterialX, DEFAULT_MATERIALX_READ_LIMITS } from 'mtlx-core';
import { supportedMaterialXCategories } from 'mtlx-viewer/capabilities';
import { readBoundedResponse } from './material-bytes';
import type { MaterialXAnalysis } from './validate';

export async function analyzeBytes(
  data: ArrayBuffer,
  name: string,
  resourceUrl?: string,
  signal?: AbortSignal,
): Promise<MaterialXAnalysis> {
  const result = await inspectMaterialX(new Uint8Array(data), name, {
    supportedCategories: supportedMaterialXCategories,
    readResource: resourceUrl
      ? async (path) => {
          const url = new URL(path, resourceUrl);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported resource URL: ${url.protocol}`);
          const response = await fetch(url, { signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
          return new Uint8Array(
            await readBoundedResponse(
              response,
              /\.mtlx$/i.test(url.pathname)
                ? DEFAULT_MATERIALX_READ_LIMITS.maxXmlBytes
                : DEFAULT_MATERIALX_READ_LIMITS.maxEntryBytes,
              signal ?? new AbortController().signal,
            ),
          );
        }
      : undefined,
  });
  // Keep dependency bytes in the worker; only diagnostics cross back to the UI.
  const { resources: _resources, ...analysis } = result;
  return analysis;
}
