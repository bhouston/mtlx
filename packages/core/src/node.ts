/**
 * Filesystem entry points for Node.js: read and write `.mtlx` and `.mtlx.zip` files.
 *
 * Everything here is a thin wrapper that reads bytes with `node:fs` and hands them to the pure
 * functions in the root `mtlx-core` entry, which never touch a filesystem themselves.
 *
 * @module mtlx-core/node
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkMaterialXZipArchive, createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import {
  detectFormat,
  packageFromArchive,
  packageToEntries,
  resolveMaterialXResources,
  type MaterialXFormat,
  type MaterialXPackage,
} from './package.js';
import type { MaterialXDocument, MaterialXValidationIssue } from './types.js';
import { checkMaterialXText } from './validate.js';
import { parseMaterialX, serializeMaterialX } from './xml.js';

const textDecoder = new TextDecoder();

/**
 * *Reads and parses a loose `.mtlx` file.*
 *
 * @category Parsing
 */
export const readMaterialX = async (filePath: string): Promise<MaterialXDocument> =>
  parseMaterialX(await readFile(filePath, 'utf8'));

/**
 * *Serializes a document and writes it to a `.mtlx` file.*
 *
 * @category Parsing
 */
export const writeMaterialX = async (filePath: string, document: MaterialXDocument): Promise<void> =>
  writeFile(filePath, serializeMaterialX(document), 'utf8');

const readArchive = async (inputPath: string) => inspectMaterialXZipArchive(await readFile(inputPath));

/**
 * *Loads just the document out of a `.mtlx` or `.mtlx.zip` path.* Use this when you only need to
 * read or summarize; use {@link loadMaterialXPackage} when you need the resources too.
 *
 * @category Packaging
 */
export const loadMaterialXDocument = async (
  inputPath: string,
): Promise<{ document: MaterialXDocument; rootPath: string; format: MaterialXFormat }> => {
  const format = detectFormat(inputPath);
  if (format === 'mtlx') {
    return { document: await readMaterialX(inputPath), rootPath: inputPath, format };
  }
  const archive = await readArchive(inputPath);
  if (!archive.rootEntry) {
    throw new Error(`No root .mtlx entry found in ${inputPath}`);
  }
  return {
    document: parseMaterialX(textDecoder.decode(archive.rootEntry.data)),
    rootPath: archive.rootEntry.path,
    format,
  };
};

/**
 * *Loads a `.mtlx` or `.mtlx.zip` file into an in-memory {@link MaterialXPackage}.*
 *
 * For a loose `.mtlx`, every referenced file is read from disk relative to the document and the
 * references are rewritten to archive paths. For archives, the entries become resources as-is.
 *
 * Example:
 *
 * ```ts
 * const pkg = await loadMaterialXPackage('material.mtlx');
 * await transform(pkg, resizeTextures({ maxImageSize: 1024 }));
 * await writeMaterialXPackage(pkg, 'material.mtlx.zip');
 * ```
 *
 * @category Packaging
 */
export const loadMaterialXPackage = async (inputPath: string): Promise<MaterialXPackage> => {
  if (detectFormat(inputPath) === 'mtlx') {
    const document = await readMaterialX(inputPath);
    const rootDir = path.dirname(inputPath);
    const resources = await resolveMaterialXResources(document, (rel) =>
      readFile(path.join(rootDir, ...rel.split('/'))),
    );
    return { rootPath: path.basename(inputPath), document, resources };
  }
  return packageFromArchive(await readArchive(inputPath));
};

/**
 * *The result of {@link writeMaterialXPackage}.*
 *
 * @category Packaging
 */
export interface WriteMaterialXPackageResult {
  outputPath: string;
  /** For archives, the root document's path inside the archive; for `.mtlx`, its path on disk. */
  rootPath: string;
  format: MaterialXFormat;
  entries: string[];
}

/**
 * *Writes a package to disk in the format implied by `outputPath`'s extension.*
 *
 * `.mtlx.zip` produces a single archive file. Any other path is treated as the root `.mtlx`
 * document, with resources written beside it at their archive-relative paths.
 *
 * @category Packaging
 */
export const writeMaterialXPackage = async (
  pkg: MaterialXPackage,
  outputPath: string,
): Promise<WriteMaterialXPackageResult> => {
  const format = detectFormat(outputPath);
  const entries = packageToEntries(pkg);
  await mkdir(path.dirname(outputPath), { recursive: true });

  if (format === 'mtlx') {
    const outputDir = path.dirname(outputPath);
    const [root, ...resources] = entries;
    await writeFile(outputPath, root!.data);
    for (const entry of resources) {
      const target = path.join(outputDir, ...entry.path.split('/'));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, entry.data);
    }
    return {
      outputPath,
      rootPath: outputPath,
      format,
      entries: [path.basename(outputPath), ...resources.map((entry) => entry.path)],
    };
  }

  await writeFile(outputPath, createMaterialXZipArchive(entries));
  return { outputPath, rootPath: pkg.rootPath, format, entries: entries.map((entry) => entry.path) };
};

/**
 * *The result of {@link checkMaterialX}.*
 *
 * @category Validation
 */
export interface CheckMaterialXResult {
  path: string;
  format: MaterialXFormat;
  issues: MaterialXValidationIssue[];
}

/**
 * *Validates a `.mtlx` or `.mtlx.zip` file, returning issues rather than throwing.*
 *
 * For archives this covers container-level checks as well as the document inside. An unreadable
 * file is reported as a single error issue.
 *
 * Example:
 *
 * ```ts
 * const { issues } = await checkMaterialX('material.mtlx.zip');
 * process.exitCode = issues.some((issue) => issue.level === 'error') ? 1 : 0;
 * ```
 *
 * @category Validation
 */
export const checkMaterialX = async (inputPath: string): Promise<CheckMaterialXResult> => {
  try {
    const format = detectFormat(inputPath);
    const data = await readFile(inputPath);
    const issues =
      format === 'mtlx' ? checkMaterialXText(textDecoder.decode(data), inputPath) : checkMaterialXZipArchive(data);
    return { path: inputPath, format, issues };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { path: inputPath, format: 'mtlx', issues: [{ level: 'error', location: inputPath, message }] };
  }
};
