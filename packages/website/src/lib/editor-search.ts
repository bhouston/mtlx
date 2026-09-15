import {
  inspectMaterialXZipArchive,
  packageFromArchive,
  packageToEntries,
  createMaterialXZipArchive,
  type MaterialXPackage,
} from 'mtlx-core';
import { viewerSearch, type ViewerSearch } from './viewer-search';

export const EDITOR_LAYOUTS = ['horizontal', 'vertical', 'overlay'] as const;
export type EditorLayout = (typeof EDITOR_LAYOUTS)[number];

export type EditorSearch = ViewerSearch & { scope?: string; layout?: EditorLayout };
export function editorSearch(search: Record<string, unknown>): EditorSearch {
  return {
    ...viewerSearch(search),
    ...(typeof search.scope === 'string' && search.scope.length <= 256 ? { scope: search.scope } : {}),
    ...(EDITOR_LAYOUTS.includes(search.layout as EditorLayout) ? { layout: search.layout as EditorLayout } : {}),
  };
}
export interface SnapshotLimits {
  maxArchiveBytes: number;
  maxExpandedBytes: number;
}
/** Fragment links stay short enough to paste anywhere. */
export const SHARE_LIMITS: SnapshotLimits = { maxArchiveBytes: 24 * 1024, maxExpandedBytes: 1024 * 1024 };
/** Local drafts may carry textures; browsers allow a few megabytes per origin. */
export const DRAFT_LIMITS: SnapshotLimits = { maxArchiveBytes: 3 * 1024 * 1024, maxExpandedBytes: 32 * 1024 * 1024 };
const tooLarge = 'This material is too large for a self-contained link. Download the .mtlx.zip to share your edits.';
export const hasEditorSnapshot = (hash: string): boolean => hash.replace(/^#/, '').startsWith('material=');

/** A package as a base64url `.mtlx.zip`; throws when it exceeds the limits. */
export function encodeEditorSnapshot(pkg: MaterialXPackage, limits = SHARE_LIMITS): string {
  const entries = packageToEntries(pkg);
  if (entries.length > 128 || entries.reduce((sum, entry) => sum + entry.data.byteLength, 0) > limits.maxExpandedBytes)
    throw new Error(tooLarge);
  const bytes = createMaterialXZipArchive(entries);
  if (bytes.length > limits.maxArchiveBytes) throw new Error(tooLarge);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
export function decodeEditorSnapshot(encoded: string, limits = SHARE_LIMITS): MaterialXPackage {
  if (!encoded || encoded.length > (limits.maxArchiveBytes * 4) / 3 || !/^[\w-]+$/.test(encoded))
    throw new Error('Invalid or oversized shared material link.');
  const raw = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  const archiveLimits = {
    ...limits,
    maxEntryBytes: limits.maxExpandedBytes,
    maxXmlBytes: limits.maxExpandedBytes,
    maxArchiveEntries: 128,
  };
  return packageFromArchive(inspectMaterialXZipArchive(bytes, archiveLimits), { limits: archiveLimits });
}
/** Small snapshots travel in the fragment, which is not sent to the web server. */
export const readEditorSnapshot = (hash: string): MaterialXPackage =>
  decodeEditorSnapshot(hash.replace(/^#?material=/, ''));

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
  if (!sourceUrl) url.hash = `material=${encodeEditorSnapshot(pkg)}`;
  return url.href;
}
