import { packageFromArchive } from './package.js';
import { validateMaterialXPackage } from './validate-package.js';
import type { MaterialXValidationOptions } from './validate.js';
import { Unzip, UnzipInflate, unzipSync, zipSync } from 'fflate';
import { resolveMaterialXReadLimits, type MaterialXReadLimits } from './limits.js';
import type { MaterialXPackageEntry } from './package.js';
import type { MaterialXValidationIssue } from './types.js';
import { checkMaterialXText } from './validate.js';

// Reader/writer for ".mtlx.zip": an ordinary zip (any tool, any compression, root .mtlx
// anywhere) containing a MaterialX document plus resources. Makes no spec-compliance
// assumptions about entry order or compression method.

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
 * *Unzips `.mtlx.zip` bytes in memory and locates the root `.mtlx` entry.* Works in Node and the
 * browser.
 *
 * @category Packaging
 */
export const inspectMaterialXZipArchive = (
  data: Uint8Array,
  overrides?: Partial<MaterialXReadLimits>,
): MaterialXZipArchive => {
  const entries: MaterialXZipEntry[] = [];
  try {
    const limits = resolveMaterialXReadLimits(overrides);
    if (data.byteLength > limits.maxArchiveBytes) {
      throw new Error(`Archive exceeds maxArchiveBytes (${limits.maxArchiveBytes})`);
    }
    if (data.byteLength < 22) throw new Error('Truncated ZIP header');

    // First inspect ALL central-directory entries. Returning false prevents fflate from
    // allocating output buffers or inflating anything before the aggregate budget is known.
    const expected = new Map<string, number>();
    let declaredBytes = 0;
    unzipSync(data, {
      filter: (file) => {
        if (expected.has(file.name)) throw new Error(`Duplicate archive path: ${file.name}`);
        if (expected.size >= limits.maxArchiveEntries) {
          throw new Error(`Archive exceeds maxArchiveEntries (${limits.maxArchiveEntries})`);
        }
        if (
          !Number.isSafeInteger(file.originalSize) ||
          file.originalSize < 0 ||
          !Number.isSafeInteger(file.size) ||
          file.size < 0
        ) {
          throw new Error(`Invalid archive entry size: ${file.name}`);
        }
        if (Math.max(file.originalSize, file.compression === 0 ? file.size : 0) > limits.maxEntryBytes) {
          throw new Error(`Archive entry exceeds maxEntryBytes (${limits.maxEntryBytes}): ${file.name}`);
        }
        if (file.name.toLowerCase().endsWith('.mtlx') && file.originalSize > limits.maxXmlBytes) {
          throw new Error(`Archive document exceeds maxXmlBytes (${limits.maxXmlBytes}): ${file.name}`);
        }
        declaredBytes += Math.max(file.originalSize, file.compression === 0 ? file.size : 0);
        if (declaredBytes > limits.maxExpandedBytes) {
          throw new Error(`Archive exceeds maxExpandedBytes (${limits.maxExpandedBytes})`);
        }
        expected.set(file.name, file.originalSize);
        return false;
      },
    });

    // Do not trust declared lengths for actual decompression. Feed small compressed chunks
    // so inflation can be stopped between chunks even if an attacker lies about output size.
    const seen = new Set<string>();
    let expandedBytes = 0;
    let completed = 0;
    const unzip = new Unzip((file) => {
      if (!expected.has(file.name) || seen.has(file.name)) {
        throw new Error(`Unexpected or duplicate archive path: ${file.name}`);
      }
      seen.add(file.name);
      const chunks: Uint8Array[] = [];
      let entryBytes = 0;
      file.ondata = (error, chunk, final) => {
        if (error) throw error;
        entryBytes += chunk.byteLength;
        expandedBytes += chunk.byteLength;
        if (entryBytes > limits.maxEntryBytes) {
          throw new Error(`Archive entry exceeds maxEntryBytes (${limits.maxEntryBytes}): ${file.name}`);
        }
        if (expandedBytes > limits.maxExpandedBytes) {
          throw new Error(`Archive exceeds maxExpandedBytes (${limits.maxExpandedBytes})`);
        }
        if (entryBytes > expected.get(file.name)!) {
          throw new Error(`Archive entry size differs from directory: ${file.name}`);
        }
        chunks.push(chunk);
        if (final) {
          if (entryBytes !== expected.get(file.name)) {
            throw new Error(`Archive entry size differs from directory: ${file.name}`);
          }
          completed++;
          if (!file.name.endsWith('/')) {
            const entryData = new Uint8Array(entryBytes);
            let offset = 0;
            for (const part of chunks) {
              entryData.set(part, offset);
              offset += part.byteLength;
            }
            entries.push({ path: file.name, data: entryData });
          }
          chunks.length = 0;
        }
      };
      file.start();
    });
    unzip.register(UnzipInflate);
    const chunkSize = 8192;
    for (let offset = 0; offset < data.byteLength; offset += chunkSize) {
      unzip.push(data.subarray(offset, offset + chunkSize), offset + chunkSize >= data.byteLength);
    }
    if (completed !== expected.size) throw new Error('Archive entries are missing or truncated');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], issues: [{ level: 'error', location: '', message: `Not a valid zip archive: ${message}` }] };
  }

  const mtlxEntries = entries.filter((entry) => entry.path.toLowerCase().endsWith('.mtlx'));
  const rootEntry = mtlxEntries.find((entry) => !entry.path.includes('/')) ?? mtlxEntries[0];

  const issues: MaterialXValidationIssue[] = [];
  if (!rootEntry) {
    issues.push({ level: 'error', location: '', message: 'Archive does not contain a .mtlx file' });
  }

  return { entries, rootEntry, issues };
};

/**
 * *Builds a DEFLATE-compressed `.mtlx.zip` archive in memory.* No ordering, compression, or
 * alignment constraints.
 *
 * @category Packaging
 */
export const createMaterialXZipArchive = (entries: MaterialXPackageEntry[]): Uint8Array => {
  const paths = new Set<string>();
  for (const entry of entries) {
    if (paths.has(entry.path)) throw new Error(`Duplicate archive path: ${entry.path}`);
    paths.add(entry.path);
  }
  return zipSync(Object.fromEntries(entries.map((entry) => [entry.path, entry.data])));
};

/**
 * *Inspects `.mtlx.zip` bytes and validates the root document it contains.*
 *
 * @category Validation
 */
export const checkMaterialXZipArchive = (
  data: Uint8Array,
  limits?: Partial<MaterialXReadLimits>,
  validation?: MaterialXValidationOptions,
): MaterialXValidationIssue[] => {
  const archive = inspectMaterialXZipArchive(data, limits);
  if (!archive.rootEntry) return archive.issues;
  const parseIssues = checkMaterialXText(textDecoder.decode(archive.rootEntry.data), archive.rootEntry.path, limits, {
    rules: [],
  });
  if (parseIssues.some((issue) => issue.level === 'error')) return [...archive.issues, ...parseIssues];
  try {
    return [...archive.issues, ...validateMaterialXPackage(packageFromArchive(archive), validation)];
  } catch (error) {
    return [
      {
        level: 'error',
        code: 'PACKAGE_INVALID',
        rule: 'resources',
        location: archive.rootEntry.path,
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
};
