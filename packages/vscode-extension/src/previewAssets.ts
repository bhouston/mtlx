import { homedir } from 'node:os';
import * as vscode from 'vscode';
import type { NamedPreviewAsset } from './previewSettings.js';

const MAX_BYTES = 128 * 1024 * 1024;
export interface PreviewAssetBytes {
  data: ArrayBuffer;
  source: string;
  resources: Array<{ path: string; data: ArrayBuffer }>;
}

export function configuredAssetUri(source: string, documentUri: vscode.Uri): vscode.Uri {
  if (/^https?:\/\//i.test(source) || /^file:/i.test(source)) return vscode.Uri.parse(source);
  if (/^[a-z][a-z0-9+.-]*:/i.test(source) && !/^[a-z]:[\\/]/i.test(source)) return vscode.Uri.parse(source);
  if (source.startsWith('~/') || source.startsWith('~\\')) return vscode.Uri.file(`${homedir()}/${source.slice(2)}`);
  if (/^[a-z]:[\\/]/i.test(source) || source.startsWith('/')) return vscode.Uri.file(source);
  const base = vscode.workspace.getWorkspaceFolder(documentUri)?.uri ?? vscode.Uri.joinPath(documentUri, '..');
  return vscode.Uri.joinPath(base, source);
}

async function readBytes(uri: vscode.Uri, signal: AbortSignal): Promise<{ bytes: Uint8Array; uri: vscode.Uri }> {
  signal.throwIfAborted();
  if (uri.scheme === 'http' || uri.scheme === 'https') {
    const response = await fetch(uri.toString(), { signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]) });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${uri}`);
    if (!response.body) throw new Error(`Empty response: ${uri}`);
    const reader = response.body.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Preview asset exceeds 128 MiB');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) throw new Error('Preview asset exceeds 128 MiB');
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return { bytes, uri: response.url ? vscode.Uri.parse(response.url) : uri };
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
  const stat = await vscode.workspace.fs.stat(uri);
  if (stat.size > MAX_BYTES) throw new Error('Preview asset exceeds 128 MiB');
  const bytes = await vscode.workspace.fs.readFile(uri);
  signal.throwIfAborted();
  if (bytes.byteLength > MAX_BYTES) throw new Error('Preview asset exceeds 128 MiB');
  return { bytes, uri };
}

/** Host-side reads avoid browser CORS restrictions and preserve glTF sidecar base URIs. */
export async function loadPreviewAsset(
  asset: NamedPreviewAsset,
  kind: 'ibl' | 'geometry',
  documentUri: vscode.Uri,
  signal: AbortSignal,
): Promise<PreviewAssetBytes> {
  const source = configuredAssetUri(asset.source, documentUri);
  const root = await readBytes(source, signal);
  const result: PreviewAssetBytes = { data: root.bytes.slice().buffer, source: source.path, resources: [] };
  if (kind === 'ibl') return result;
  let jsonBytes = root.bytes;
  const view = new DataView(root.bytes.buffer, root.bytes.byteOffset, root.bytes.byteLength);
  if (root.bytes.length >= 20 && view.getUint32(0, true) === 0x46546c67) {
    const length = view.getUint32(12, true);
    if (view.getUint32(16, true) !== 0x4e4f534a || length > root.bytes.length - 20)
      throw new Error('Invalid GLB JSON chunk');
    jsonBytes = root.bytes.subarray(20, 20 + length);
  }
  const json = JSON.parse(new TextDecoder().decode(jsonBytes)) as {
    buffers?: Array<{ uri?: string }>;
    images?: Array<{ uri?: string }>;
  };
  const references = [
    ...new Set(
      [...(json.buffers ?? []), ...(json.images ?? [])].flatMap((entry) =>
        typeof entry.uri === 'string' && !entry.uri.startsWith('data:') ? [entry.uri] : [],
      ),
    ),
  ];
  if (references.length > 256) throw new Error('glTF has more than 256 external resources');
  let total = root.bytes.byteLength;
  for (const reference of references) {
    const uri =
      root.uri.scheme === 'http' || root.uri.scheme === 'https'
        ? vscode.Uri.parse(new URL(reference, root.uri.toString()).href)
        : /^[a-z][a-z0-9+.-]*:/i.test(reference)
          ? vscode.Uri.parse(reference)
          : reference.startsWith('/')
            ? root.uri.with({ path: decodeURIComponent(reference) })
            : vscode.Uri.joinPath(root.uri, '..', decodeURIComponent(reference));
    const { bytes } = await readBytes(uri, signal);
    total += bytes.byteLength;
    if (total > MAX_BYTES) throw new Error('Geometry and sidecars exceed 128 MiB');
    result.resources.push({ path: reference, data: bytes.slice().buffer });
  }
  return result;
}
