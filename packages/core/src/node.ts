import { validateMaterialXPackage } from './validate-package.js';
import { validateDocument } from './validate.js';
import type { MaterialXReadLimits } from './limits.js';
import { applyResourceDestinations, cloneMaterialXPackage } from './resource-graph.js';
/**
 * Filesystem entry points for Node.js: read and write `.mtlx` and `.mtlx.zip` files.
 *
 * Everything here is a thin wrapper that reads bytes with `node:fs` and hands them to the pure
 * functions in the root `mtlx-core` entry, which never touch a filesystem themselves.
 *
 * @module mtlx-core/node
 */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, writeFile, rename, unlink, link, rmdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import {
  detectFormat,
  packageFromArchive,
  packageToEntries,
  resolveMaterialXResources,
  validateArchivePath,
  isImagePath,
  type MaterialXFormat,
  type MaterialXPackage,
} from './package.js';
import type { MaterialXDocument, MaterialXValidationIssue } from './types.js';
import { type MaterialXValidationOptions } from './validate.js';
import { parseMaterialX, serializeMaterialX } from './xml.js';

const textDecoder = new TextDecoder();

/**
 * *Reads and parses a loose `.mtlx` file.*
 *
 * @category Parsing
 */
export const readMaterialX = async (
  filePath: string,
  limits?: Partial<MaterialXReadLimits>,
): Promise<MaterialXDocument> => parseMaterialX(await readFile(filePath, 'utf8'), limits);

/**
 * *Serializes a document and writes it to a `.mtlx` file.*
 *
 * @category Parsing
 */
export const writeMaterialX = async (filePath: string, document: MaterialXDocument): Promise<void> =>
  writeFile(filePath, serializeMaterialX(document), 'utf8');

const readArchive = async (inputPath: string, limits?: Partial<MaterialXReadLimits>) =>
  inspectMaterialXZipArchive(await readFile(inputPath), limits);

/**
 * *Loads just the document out of a `.mtlx` or `.mtlx.zip` path.* Use this when you only need to
 * read or summarize; use {@link loadMaterialXPackage} when you need the resources too.
 *
 * @category Packaging
 */
export const loadMaterialXDocument = async (
  inputPath: string,
  options: { limits?: Partial<MaterialXReadLimits> } = {},
): Promise<{ document: MaterialXDocument; rootPath: string; format: MaterialXFormat }> => {
  const format = detectFormat(inputPath);
  if (format === 'mtlx') {
    return { document: await readMaterialX(inputPath, options.limits), rootPath: inputPath, format };
  }
  const archive = await readArchive(inputPath, options.limits);
  if (!archive.rootEntry) {
    throw new Error(`No root .mtlx entry found in ${inputPath}`);
  }
  return {
    document: parseMaterialX(textDecoder.decode(archive.rootEntry.data), options.limits),
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
export const loadMaterialXPackage = async (
  inputPath: string,
  options: { limits?: Partial<MaterialXReadLimits> } = {},
): Promise<MaterialXPackage> => {
  if (detectFormat(inputPath) === 'mtlx') {
    const document = await readMaterialX(inputPath, options.limits);
    const rootDir = path.dirname(inputPath);
    const resources = await resolveMaterialXResources(
      document,
      (rel) => readFile(path.join(rootDir, ...rel.split('/'))),
      { rootPath: path.basename(inputPath), limits: options.limits },
    );
    return { rootPath: path.basename(inputPath), document, resources };
  }
  return packageFromArchive(await readArchive(inputPath, options.limits), options);
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

/** Output planning is read-only; only commitMaterialXPackageWrite changes the filesystem. */
export interface WriteMaterialXPackageOptions {
  textureLibrary?: string;
  /** Defaults to true for the SDK; editor integrations reserve a unique output themselves. */
  overwrite?: boolean;
  /** Virtual prior outputs for a batch dry run. Never written by the planner. */
  plannedFiles?: ReadonlyMap<string, Uint8Array>;
}
export interface MaterialXPlannedFile {
  path: string;
  data: Uint8Array;
  action: 'write' | 'reuse';
  /** Hash captured during planning; null means this destination must still be absent. */
  expected: string | null;
  root: boolean;
}
export interface MaterialXWritePlan extends WriteMaterialXPackageResult {
  files: MaterialXPlannedFile[];
  overwrite: boolean;
}
const hashBytes = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex');

/** Reject existing symlinks anywhere in a target path, including an explicitly selected library.
 * This policy avoids following links outside the intended destination. It is not a sandbox
 * against another process racing directory changes during commit. */
const assertNoSymlinks = async (target: string): Promise<void> => {
  const absolute = path.resolve(target);
  const root = path.parse(absolute).root;
  let current = root;
  const segments = absolute.slice(root.length).split(path.sep).filter(Boolean);
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    try {
      const info = await lstat(current);
      const systemAlias = process.platform === 'darwin' && ['/var', '/tmp', '/etc'].includes(current);
      if (info.isSymbolicLink() && !systemAlias) throw new Error(`Refusing symbolic link in output path: ${current}`);
      if (systemAlias) continue;
      if (index < segments.length - 1 && !info.isDirectory())
        throw new Error(`Output parent is not a directory: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
};
const existingBytes = async (target: string): Promise<Uint8Array | undefined> => {
  try {
    return await readFile(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
};
const resourceBytes = (resource: MaterialXPackage['resources'][number]): Uint8Array =>
  resource.document ? new TextEncoder().encode(serializeMaterialX(resource.document)) : resource.data;

export const planMaterialXPackageWrite = async (
  input: MaterialXPackage,
  outputPath: string,
  options: WriteMaterialXPackageOptions = {},
): Promise<MaterialXWritePlan> => {
  // Validate original archive identities before allowing a deliberate filesystem relocation.
  const paths = [input.rootPath, ...input.resources.map((r) => r.archivePath)];
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate package entry path');
  for (const entry of paths) {
    const issue = validateArchivePath(entry);
    if (issue || entry.includes('\0')) throw new Error(`${issue ?? 'Null in archive path'}: ${entry}`);
  }
  const pkg = cloneMaterialXPackage(input);
  const resourceIssues = validateMaterialXPackage(pkg, { rules: ['resources'] });
  if (resourceIssues.some((issue) => issue.level === 'error'))
    throw new Error(resourceIssues.map((issue) => issue.message).join('; '));
  const format = detectFormat(outputPath);
  const output = path.resolve(outputPath);
  await assertNoSymlinks(output);
  const lookup = async (target: string) => options.plannedFiles?.get(target) ?? (await existingBytes(target));
  const originalOutput = await lookup(output);
  if (originalOutput && options.overwrite === false) throw new Error(`Output already exists: ${output}`);
  const files: MaterialXPlannedFile[] = [];
  if (format === 'mtlx.zip') {
    files.push({
      path: output,
      data: createMaterialXZipArchive(packageToEntries(pkg)),
      action: 'write',
      expected: originalOutput ? hashBytes(originalOutput) : null,
      root: true,
    });
  } else {
    const outputDir = path.dirname(output);
    const requested = pkg.resources.map((resource) =>
      options.textureLibrary && isImagePath(resource.archivePath)
        ? path.resolve(outputDir, options.textureLibrary, path.posix.basename(resource.archivePath))
        : path.resolve(outputDir, ...resource.archivePath.split('/')),
    );
    const protectedPaths = new Set([output, ...requested]);
    const used = new Map<string, Uint8Array>();
    used.set(output, new Uint8Array());
    const destinations = new Map<string, string>();
    const choices: Array<{ target: string; existing?: Uint8Array }> = [];
    for (const [index, resource] of pkg.resources.entries()) {
      const requestedPath = requested[index]!;
      const extension = path.extname(requestedPath);
      const stem = extension ? requestedPath.slice(0, -extension.length) : requestedPath;
      let target = requestedPath;
      let old: Uint8Array | undefined;
      const bytes = resourceBytes(resource);
      for (let suffix = 1; ; suffix++) {
        if (suffix > 1) {
          target = `${stem}-${suffix}${extension}`;
          if (protectedPaths.has(target)) continue;
        }
        await assertNoSymlinks(target);
        old = used.get(target) ?? (await lookup(target));
        if (!used.has(target) && (!old || (!resource.document && hashBytes(old) === hashBytes(bytes)))) break;
      }
      used.set(target, bytes);
      choices.push({ target, existing: old });
      const relative = path.relative(outputDir, target);
      if (path.isAbsolute(relative))
        throw new Error('Texture library must share the output drive for relative references');
      destinations.set(resource.archivePath, relative.split(path.sep).join('/'));
    }
    applyResourceDestinations(pkg, destinations, path.basename(output));
    for (const [index, resource] of pkg.resources.entries()) {
      const { target, existing } = choices[index]!;
      files.push({
        path: target,
        data: resourceBytes(resource),
        action: existing ? 'reuse' : 'write',
        expected: existing ? hashBytes(existing) : null,
        root: false,
      });
    }
    files.push({
      path: output,
      data: new TextEncoder().encode(serializeMaterialX(pkg.document)),
      action: 'write',
      expected: originalOutput ? hashBytes(originalOutput) : null,
      root: true,
    });
  }
  // Detect file-vs-directory collisions within the plan, even if neither path exists yet.
  const targets = new Set(files.map((file) => file.path));
  for (const file of files) {
    let parent = path.dirname(file.path);
    while (parent !== path.dirname(parent)) {
      if (targets.has(parent)) throw new Error(`Output path is both a file and directory: ${parent}`);
      parent = path.dirname(parent);
    }
  }
  return {
    outputPath,
    rootPath: format === 'mtlx' ? outputPath : pkg.rootPath,
    format,
    entries:
      format === 'mtlx'
        ? [path.basename(output), ...pkg.resources.map((r) => r.archivePath)]
        : packageToEntries(pkg).map((e) => e.path),
    files,
    overwrite: options.overwrite ?? true,
  };
};

/** Stage every write, then publish new resources exclusively and replace the root last.
 * On an ordinary I/O error, new resources and staging files are rolled back. A process crash
 * can leave orphan resources, but never a half-written root document. */
export const commitMaterialXPackageWrite = async (plan: MaterialXWritePlan): Promise<WriteMaterialXPackageResult> => {
  for (const file of plan.files) {
    await assertNoSymlinks(file.path);
    const existing = await existingBytes(file.path);
    if ((existing ? hashBytes(existing) : null) !== file.expected)
      throw new Error(`Output changed since planning: ${file.path}`);
  }
  const createdDirs: string[] = [];
  const staged: Array<{ file: MaterialXPlannedFile; temporary: string }> = [];
  const published: string[] = [];
  const ensureDir = async (dir: string): Promise<void> => {
    try {
      await mkdir(dir);
      createdDirs.push(dir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await ensureDir(path.dirname(dir));
        await ensureDir(dir);
      } else if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  };
  try {
    for (const file of plan.files) {
      if (file.action === 'reuse') continue;
      await ensureDir(path.dirname(file.path));
      const temporary = path.join(path.dirname(file.path), `.mtlx-${randomUUID()}.tmp`);
      staged.push({ file, temporary });
      await writeFile(temporary, file.data, { flag: 'wx' });
    }
    // Resources first, root last irrespective of public plan array ordering.
    staged.sort((a, b) => Number(a.file.root) - Number(b.file.root));
    for (const { file, temporary } of staged) {
      await assertNoSymlinks(file.path);
      const current = await existingBytes(file.path);
      if ((current ? hashBytes(current) : null) !== file.expected)
        throw new Error(`Output changed since planning: ${file.path}`);
      if (file.root && plan.overwrite && file.expected !== null) await rename(temporary, file.path);
      else {
        await link(temporary, file.path);
        published.push(file.path);
        await unlink(temporary);
      }
    }
  } catch (error) {
    for (const target of published.toReversed()) await unlink(target).catch(() => {});
    throw error;
  } finally {
    for (const { temporary } of staged) await unlink(temporary).catch(() => {});
    for (const dir of createdDirs.toReversed()) await rmdir(dir).catch(() => {});
  }
  return { outputPath: plan.outputPath, rootPath: plan.rootPath, format: plan.format, entries: plan.entries };
};

export const writeMaterialXPackage = async (
  pkg: MaterialXPackage,
  outputPath: string,
  options: WriteMaterialXPackageOptions = {},
): Promise<WriteMaterialXPackageResult> =>
  commitMaterialXPackageWrite(await planMaterialXPackageWrite(pkg, outputPath, options));

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
export const checkMaterialX = async (
  inputPath: string,
  options: { validation?: MaterialXValidationOptions; limits?: Partial<MaterialXReadLimits> } = {},
): Promise<CheckMaterialXResult> => {
  const format = detectFormat(inputPath);
  const validation = {
    ...options.validation,
    rules: options.validation?.rules ?? ['basic', 'structure', 'resources'],
  } as MaterialXValidationOptions;
  try {
    const data = await readFile(inputPath);
    const document = format === 'mtlx' ? parseMaterialX(textDecoder.decode(data), options.limits) : undefined;
    if (!document) {
      const archive = inspectMaterialXZipArchive(data, options.limits);
      if (!archive.rootEntry) return { path: inputPath, format, issues: archive.issues };
      return {
        path: inputPath,
        format,
        issues: validateMaterialXPackage(packageFromArchive(archive, options), validation),
      };
    }
    if (!validation.rules!.includes('resources'))
      return { path: inputPath, format, issues: validateDocument(document, validation) };
    const resources = await resolveMaterialXResources(
      document,
      (rel) => readFile(path.join(path.dirname(inputPath), rel)),
      { rootPath: path.basename(inputPath), limits: options.limits },
    );
    return {
      path: inputPath,
      format,
      issues: validateMaterialXPackage({ rootPath: path.basename(inputPath), document, resources }, validation),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const resourceError = /Referenced file|include cycle|references cannot/.test(message);
    return {
      path: inputPath,
      format,
      issues: [
        {
          level: 'error',
          code: resourceError ? 'RESOURCE_RESOLUTION_FAILED' : 'READ_OR_PARSE_ERROR',
          rule: resourceError ? 'resources' : 'basic',
          location: inputPath,
          message,
        },
      ],
    };
  }
};

export { processMaterialX } from './processing.js';
export type { MaterialXProcessingOptions, MaterialXProcessingResult } from './processing.js';
