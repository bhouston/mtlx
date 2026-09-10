import { unzipSync, zipSync } from 'fflate';
import type { MaterialXPackageEntry } from './package.js';
import type { MaterialXValidationIssue } from './types.js';
import { checkMaterialXText } from './validate.js';

// Relaxed reader/writer for ".mtlx.zip": an ordinary zip (any tool, any compression, root .mtlx
// anywhere) containing a MaterialX document plus resources. Unlike ".mtlz" (see mtlz.ts), this
// makes no spec-compliance assumptions about entry order or compression method.

const textDecoder = new TextDecoder();

/**
 * *One file entry read from a `.mtlx.zip` archive.*
 *
 * @category Packaging
 */
export interface MaterialXZipEntry {
  path: string;
  data: Uint8Array;
}

/**
 * *The result of {@link inspectMaterialXZipArchive}.*
 *
 * @category Packaging
 */
export interface MaterialXZipArchive {
  entries: MaterialXZipEntry[];
  rootEntry?: MaterialXZipEntry;
  issues: MaterialXValidationIssue[];
}

/**
 * *Unzips `.mtlx.zip` bytes in memory and locates the root `.mtlx` entry.* Accepts any ordinary
 * zip, so it also reads `.mtlz` files when spec checks are not needed. Works in Node and the
 * browser.
 *
 * @category Packaging
 */
export const inspectMaterialXZipArchive = (data: Uint8Array): MaterialXZipArchive => {
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], issues: [{ level: 'error', location: '', message: `Not a valid zip archive: ${message}` }] };
  }

  const entries = Object.entries(unzipped)
    .filter(([entryPath]) => !entryPath.endsWith('/'))
    .map(([entryPath, entryData]) => ({ path: entryPath, data: entryData }));

  const mtlxEntries = entries.filter((entry) => entry.path.toLowerCase().endsWith('.mtlx'));
  const rootEntry = mtlxEntries.find((entry) => !entry.path.includes('/')) ?? mtlxEntries[0];

  const issues: MaterialXValidationIssue[] = [];
  if (!rootEntry) {
    issues.push({ level: 'error', location: '', message: 'Archive does not contain a .mtlx file' });
  }

  return { entries, rootEntry, issues };
};

/**
 * *Builds a DEFLATE-compressed `.mtlx.zip` archive in memory.* The relaxed counterpart of
 * {@link createMaterialZArchive}: no ordering, compression, or alignment constraints.
 *
 * @category Packaging
 */
export const createMaterialXZipArchive = (entries: MaterialXPackageEntry[]): Uint8Array =>
  zipSync(Object.fromEntries(entries.map((entry) => [entry.path, entry.data])));

/**
 * *Inspects `.mtlx.zip` bytes and validates the root document it contains.*
 *
 * @category Validation
 */
export const checkMaterialXZipArchive = (data: Uint8Array): MaterialXValidationIssue[] => {
  const archive = inspectMaterialXZipArchive(data);
  if (!archive.rootEntry) {
    return archive.issues;
  }
  return [...archive.issues, ...checkMaterialXText(textDecoder.decode(archive.rootEntry.data), archive.rootEntry.path)];
};
