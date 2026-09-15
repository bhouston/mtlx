import {
  inspectMaterialXZipArchive,
  packageFromArchive,
  packageToEntries,
  createMaterialXZipArchive,
  type MaterialXPackage,
} from 'mtlx-core';
import { viewerSearch, type ViewerSearch } from './viewer-search';

export type EditorSearch = ViewerSearch & { scope?: string };
export function editorSearch(search: Record<string, unknown>): EditorSearch {
  return {
    ...viewerSearch(search),
    ...(typeof search.scope === 'string' && search.scope.length <= 256 ? { scope: search.scope } : {}),
  };
}
const MAX_SHARE_BYTES = 24 * 1024;
const MAX_SHARE_EXPANDED_BYTES = 1024 * 1024;
const tooLarge = 'This material is too large for a self-contained link. Download the .mtlx.zip to share your edits.';
export const hasEditorSnapshot = (hash: string): boolean => hash.replace(/^#/, '').startsWith('material=');

/** Small snapshots travel in the fragment, which is not sent to the web server. */
export function readEditorSnapshot(hash: string): MaterialXPackage {
  const encoded = hash.replace(/^#?material=/, '');
  if (!encoded || encoded.length > (MAX_SHARE_BYTES * 4) / 3 || !/^[\w-]+$/.test(encoded))
    throw new Error('Invalid or oversized shared material link.');
  const raw = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const limits = {
    maxArchiveBytes: MAX_SHARE_BYTES,
    maxExpandedBytes: MAX_SHARE_EXPANDED_BYTES,
    maxEntryBytes: MAX_SHARE_EXPANDED_BYTES,
    maxXmlBytes: MAX_SHARE_EXPANDED_BYTES,
    maxArchiveEntries: 128,
  };
  return packageFromArchive(inspectMaterialXZipArchive(bytes, limits), { limits });
}

/** Supply sourceUrl only when the current document still matches that source. */
export function editorShareUrl(
  origin: string,
  search: EditorSearch,
  pkg: MaterialXPackage,
  sourceUrl?: string,
): string {
  const url = new URL('/editor', origin);
  const state = editorSearch({ ...search, materialUrl: sourceUrl });
  for (const [key, value] of Object.entries(state)) if (value !== undefined) url.searchParams.set(key, String(value));
  if (!sourceUrl) {
    const entries = packageToEntries(pkg);
    if (
      entries.length > 128 ||
      entries.reduce((sum, entry) => sum + entry.data.byteLength, 0) > MAX_SHARE_EXPANDED_BYTES
    )
      throw new Error(tooLarge);
    const bytes = createMaterialXZipArchive(entries);
    if (bytes.length > MAX_SHARE_BYTES) throw new Error(tooLarge);
    const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    url.hash = `material=${encoded}`;
  }
  return url.href;
}
