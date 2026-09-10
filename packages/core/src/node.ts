/**
 * Filesystem entry points for Node.js: read and write `.mtlx`, `.mtlz`, and `.mtlx.zip` files.
 *
 * Everything here is a thin wrapper that reads bytes with `node:fs` and hands them to the pure
 * functions in the root `mtlx-core` entry, which never touch a filesystem themselves.
 *
 * @module mtlx-core/node
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkMaterialXZipArchive, createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import { checkMaterialZArchive, createMaterialZArchive, inspectMaterialZArchive } from './mtlz.js';
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

const readArchive = async (inputPath: string) => {
  const data = await readFile(inputPath);
  return detectFormat(inputPath) === 'mtlz' ? inspectMaterialZArchive(data) : inspectMaterialXZipArchive(data);
};

/**
 * *Loads just the document out of a `.mtlx`, `.mtlz`, or `.mtlx.zip` path.* Use this when you
 * only need to read or summarize; use {@link loadMaterialXPackage} when you need the resources too.
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
 * *Loads a `.mtlx`, `.mtlz`, or `.mtlx.zip` file into an in-memory {@link MaterialXPackage}.*
 *
 * For a loose `.mtlx`, every referenced file is read from disk relative to the document and the
 * references are rewritten to archive paths. For archives, the entries become resources as-is.
 *
 * Example:
 *
 * ```ts
 * const pkg = await loadMaterialXPackage('material.mtlx');
 * await transform(pkg, resizeTextures({ maxImageSize: 1024 }));
 * await writeMaterialXPackage(pkg, 'material.mtlz');
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
 * `.mtlz` and `.mtlx.zip` produce a single archive file. Any other path is treated as the root
 * `.mtlx` document, with resources written beside it at their archive-relative paths.
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

  await writeFile(outputPath, format === 'mtlz' ? createMaterialZArchive(entries) : createMaterialXZipArchive(entries));
  return { outputPath, rootPath: pkg.rootPath, format, entries: entries.map((entry) => entry.path) };
};

/**
 * *Options for {@link packMaterialX}.*
 *
 * @category Packaging
 */
export interface PackMaterialXOptions {
  /** Defaults to the input path with a `.mtlz` extension. Use `.mtlx.zip` for the relaxed container. */
  outputPath?: string;
}

/**
 * *Packs a loose `.mtlx` file and everything it references into a single archive.*
 *
 * Example:
 *
 * ```ts
 * await packMaterialX('material.mtlx'); // writes material.mtlz
 * await packMaterialX('material.mtlx', { outputPath: 'out/material.mtlx.zip' });
 * ```
 *
 * @category Packaging
 */
export const packMaterialX = async (
  inputPath: string,
  options: PackMaterialXOptions = {},
): Promise<WriteMaterialXPackageResult> => {
  if (detectFormat(inputPath) !== 'mtlx') {
    throw new Error('pack requires a root .mtlx input file');
  }
  const outputPath = options.outputPath ?? inputPath.replace(/\.mtlx$/i, '.mtlz');
  if (detectFormat(outputPath) === 'mtlx') {
    throw new Error('pack output must end in .mtlz or .mtlx.zip');
  }
  return writeMaterialXPackage(await loadMaterialXPackage(inputPath), outputPath);
};

/**
 * *Options for {@link unpackMaterialX}.*
 *
 * @category Packaging
 */
export interface UnpackMaterialXOptions {
  /** Defaults to a directory named after the archive, beside it. */
  outputDir?: string;
  /** Delete `outputDir` first. */
  force?: boolean;
}

/**
 * *Defaults for {@link UnpackMaterialXOptions}.*
 *
 * @category Packaging
 */
export const UNPACK_MATERIALX_DEFAULTS = { force: false } as const satisfies UnpackMaterialXOptions;

/**
 * *The result of {@link unpackMaterialX}.*
 *
 * @category Packaging
 */
export interface UnpackMaterialXResult {
  outputDir: string;
  /** Path of the extracted root `.mtlx` on disk. */
  rootPath: string;
  entries: string[];
}

/**
 * *Extracts a `.mtlz` or `.mtlx.zip` archive into a directory of loose files.*
 *
 * @category Packaging
 */
export const unpackMaterialX = async (
  inputPath: string,
  options: UnpackMaterialXOptions = {},
): Promise<UnpackMaterialXResult> => {
  const format = detectFormat(inputPath);
  if (format === 'mtlx') {
    throw new Error('unpack requires a .mtlz or .mtlx.zip archive');
  }
  const { force, outputDir = inputPath.replace(/\.(mtlz|mtlx\.zip)$/i, '') } = {
    ...UNPACK_MATERIALX_DEFAULTS,
    ...options,
  };
  const pkg = await loadMaterialXPackage(inputPath);
  if (force) {
    await rm(outputDir, { recursive: true, force: true });
  }
  const result = await writeMaterialXPackage(pkg, path.join(outputDir, ...pkg.rootPath.split('/')));
  return { outputDir, rootPath: result.rootPath, entries: result.entries };
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
 * *Validates a `.mtlx`, `.mtlz`, or `.mtlx.zip` file, returning issues rather than throwing.*
 *
 * For archives this covers container-level spec checks as well as the document inside. An
 * unreadable file is reported as a single error issue.
 *
 * Example:
 *
 * ```ts
 * const { issues } = await checkMaterialX('material.mtlz');
 * process.exitCode = issues.some((issue) => issue.level === 'error') ? 1 : 0;
 * ```
 *
 * @category Validation
 */
export const checkMaterialX = async (inputPath: string): Promise<CheckMaterialXResult> => {
  const format = detectFormat(inputPath);
  try {
    const data = await readFile(inputPath);
    const issues =
      format === 'mtlx'
        ? checkMaterialXText(textDecoder.decode(data), inputPath)
        : format === 'mtlz'
          ? checkMaterialZArchive(data)
          : checkMaterialXZipArchive(data);
    return { path: inputPath, format, issues };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { path: inputPath, format, issues: [{ level: 'error', location: inputPath, message }] };
  }
};
