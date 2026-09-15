import { DEFAULT_MATERIALX_READ_LIMITS as limits, resolveMaterialXResources, type MaterialXPackage } from 'mtlx-core';
import { getNodeCatalog, importMaterial } from 'mtlx-editor/model';
import { materialByteLimit, readBoundedResponse } from './material-bytes';
import { resolveMaterialParam } from './presets';

/** Read an editable package, retaining resource bytes for both preview and ZIP downloads. */
export async function loadEditorMaterial(
  input: File | string,
  signal: AbortSignal,
  origin: string,
): Promise<MaterialXPackage> {
  signal.throwIfAborted();
  let pkg: MaterialXPackage;
  if (typeof input !== 'string') {
    if (input.size > materialByteLimit(input.name)) throw new Error('File exceeds the MaterialX read limit.');
    const data = await input.arrayBuffer();
    signal.throwIfAborted();
    pkg = importMaterial(new Uint8Array(data), input.name);
  } else {
    const resolved = resolveMaterialParam(input);
    if (!resolved) throw new Error('Use an HTTP(S) URL ending in .mtlx or .mtlx.zip.');
    const url = new URL(resolved.folderUrl + resolved.fileName, origin);
    const response = await fetch(url.href, { signal });
    signal.throwIfAborted();
    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url.href}`);
    const data = await readBoundedResponse(response, materialByteLimit(url.pathname), signal);
    const finalUrl = new URL(response.url || url.href);
    const name = url.pathname.split('/').at(-1)!;
    pkg = importMaterial(new Uint8Array(data), name);
    if (!/\.zip$/i.test(name)) {
      // Core resolves references against a root-relative document path, then relocates
      // the dependency closure into portable archive paths. Preserve the URL directory
      // here so ../ references and redirects resolve correctly before relocation.
      const sourcePath = finalUrl.pathname.slice(1, finalUrl.pathname.lastIndexOf('/') + 1) + name;
      let totalBytes = data.byteLength;
      let count = 1;
      let resourceFailure: unknown;
      try {
        pkg.resources = await resolveMaterialXResources(
          pkg.document,
          async (path) => {
            const resourceUrl = new URL(`/${path}`, finalUrl);
            try {
              signal.throwIfAborted();
              if (++count > limits.maxArchiveEntries) throw new Error('Too many material resources.');
              const remaining = limits.maxExpandedBytes - totalBytes;
              if (remaining <= 0) throw new Error('Material resources exceed the total byte limit.');
              const resourceResponse = await fetch(resourceUrl.href, { signal });
              if (!resourceResponse.ok) throw new Error(`HTTP ${resourceResponse.status}`);
              const resourceData = await readBoundedResponse(
                resourceResponse,
                Math.min(/\.mtlx$/i.test(resourceUrl.pathname) ? limits.maxXmlBytes : limits.maxEntryBytes, remaining),
                signal,
              );
              totalBytes += resourceData.byteLength;
              return new Uint8Array(resourceData);
            } catch (error) {
              resourceFailure = new Error(
                `Could not load resource ${resourceUrl.href}: ${error instanceof Error ? error.message : String(error)}`,
                { cause: error },
              );
              throw resourceFailure;
            }
          },
          { rootPath: sourcePath },
        );
      } catch (error) {
        signal.throwIfAborted();
        throw resourceFailure ?? error;
      }
    }
  }
  signal.throwIfAborted();
  getNodeCatalog(pkg.document);
  return pkg;
}
