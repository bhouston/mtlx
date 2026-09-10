import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { materialXNodeRegistry } from './registry.js';
import type { MaterialXValidationIssue } from './types.js';
import { validateDocument } from './validate.js';
import { parseMaterialX } from './xml.js';

// Relaxed reader for ".mtlx.zip": an ordinary zip (any tool, any compression, root .mtlx
// anywhere) containing a MaterialX document plus resources. Unlike ".mtlz" (see mtlz.ts),
// this makes no spec-compliance assumptions about entry order or compression method.

const textDecoder = new TextDecoder();

export interface MaterialXZipEntry {
  path: string;
  data: Uint8Array;
}

export interface MaterialXZipArchive {
  entries: MaterialXZipEntry[];
  rootEntry?: MaterialXZipEntry;
  issues: MaterialXValidationIssue[];
}

const makeIssue = (
  level: MaterialXValidationIssue['level'],
  location: string,
  message: string,
): MaterialXValidationIssue => ({
  level,
  location,
  message,
});

const isPathInside = (parent: string, child: string): boolean => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

/** Pure, isomorphic (Node + browser): unzip in-memory bytes and locate the root .mtlx entry. */
export const inspectMaterialXZipArchive = (data: Uint8Array): MaterialXZipArchive => {
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], issues: [makeIssue('error', '', `Not a valid zip archive: ${message}`)] };
  }

  const entries = Object.entries(unzipped)
    .filter(([entryPath]) => !entryPath.endsWith('/'))
    .map(([entryPath, entryData]) => ({ path: entryPath, data: entryData }));

  const mtlxEntries = entries.filter((entry) => entry.path.toLowerCase().endsWith('.mtlx'));
  const rootEntry = mtlxEntries.find((entry) => !entry.path.includes('/')) ?? mtlxEntries[0];

  const issues: MaterialXValidationIssue[] = [];
  if (!rootEntry) {
    issues.push(makeIssue('error', '', 'Archive does not contain a .mtlx file'));
  }

  return { entries, rootEntry, issues };
};

export const readMaterialXZipArchive = async (inputPath: string): Promise<MaterialXZipArchive> => {
  const data = await readFile(inputPath);
  return inspectMaterialXZipArchive(data);
};

export interface CheckMaterialXZipResult {
  path: string;
  format: 'mtlx.zip';
  issues: MaterialXValidationIssue[];
}

export const checkMaterialXZipPackage = async (inputPath: string): Promise<CheckMaterialXZipResult> => {
  const archive = await readMaterialXZipArchive(inputPath);
  const issues = [...archive.issues];
  if (archive.rootEntry) {
    try {
      const document = parseMaterialX(textDecoder.decode(archive.rootEntry.data));
      issues.push(...validateDocument(document, materialXNodeRegistry));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(makeIssue('error', archive.rootEntry.path, message));
    }
  }
  return { path: inputPath, format: 'mtlx.zip', issues };
};

export interface UnpackMaterialXZipOptions {
  outputDir?: string;
  force?: boolean;
}

export interface UnpackMaterialXZipResult {
  outputDir: string;
  rootPath: string;
  entries: string[];
}

export const unpackMaterialXZip = async (
  inputPath: string,
  options: UnpackMaterialXZipOptions = {},
): Promise<UnpackMaterialXZipResult> => {
  const archive = await readMaterialXZipArchive(inputPath);
  if (!archive.rootEntry) {
    throw new Error(archive.issues.map((issue) => issue.message).join('\n') || 'Archive is missing a .mtlx entry');
  }

  const outputDir =
    options.outputDir ?? path.join(path.dirname(inputPath), path.basename(inputPath, '.zip').replace(/\.mtlx$/i, ''));
  if (options.force) {
    await rm(outputDir, { recursive: true, force: true });
  }
  await mkdir(outputDir, { recursive: true });

  for (const entry of archive.entries) {
    const outputPath = path.join(outputDir, ...entry.path.split('/'));
    if (!isPathInside(outputDir, outputPath)) {
      throw new Error(`Archive entry would extract outside the output directory: ${entry.path}`);
    }
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, entry.data);
  }

  return {
    outputDir,
    rootPath: path.join(outputDir, archive.rootEntry.path),
    entries: archive.entries.map((entry) => entry.path),
  };
};
