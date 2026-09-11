/**
 * Filesystem entry points for Node.js: read and write `.mtlx` and `.mtlx.zip` files.
 *
 * Everything here is a thin wrapper that reads bytes with `node:fs` and hands them to the pure
 * functions in the root `mtlx-core` entry, which never touch a filesystem themselves.
 *
 * @module mtlx-core/node
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkMaterialXZipArchive, createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import {
  detectFormat,
  packageFromArchive,
  packageToEntries,
  posixExtname,
  relocateTextureResources,
  resolveMaterialXResources,
  rewriteResourcePath,
  validateArchivePath,
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

interface DedupEntry {
  size: number;
  hash?: string;
}

/** One directory's worth of existing filenames, scanned once (sizes only; hashes computed lazily). */
interface DedupStore {
  dir: string;
  byName: Map<string, DedupEntry>;
}

const createDedupStore = async (dir: string): Promise<DedupStore> => {
  const byName = new Map<string, DedupEntry>();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return { dir, byName }; // directory doesn't exist yet
  }
  await Promise.all(
    names.map(async (name) => {
      try {
        const info = await stat(path.join(dir, name));
        if (info.isFile()) {
          byName.set(name, { size: info.size });
        }
      } catch {
        // raced with a delete between readdir and stat; ignore
      }
    }),
  );
  return { dir, byName };
};

const hashBytes = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex');

/**
 * *Writes `data` into `store.dir` as `baseName + extension`, deduplicating against existing files
 * by content.* Hashing only happens once a same-size candidate is found — both `data` and the
 * existing file are hashed then (the latter cached on the store so a repeat comparison never
 * re-reads it); distinct-size files never pay a hashing cost at all. Returns the filename actually
 * written to or matched: `baseName + extension` unless that name is taken by different content, in
 * which case `-2`, `-3`, ... suffixes are tried until a free or byte-identical name is found.
 */
const commitFile = async (
  store: DedupStore,
  baseName: string,
  extension: string,
  data: Uint8Array,
): Promise<string> => {
  let newHash: string | undefined; // only computed once a same-size candidate shows up
  for (let suffix = 1; ; suffix += 1) {
    const name = suffix === 1 ? `${baseName}${extension}` : `${baseName}-${suffix}${extension}`;
    const existing = store.byName.get(name);
    if (!existing) {
      await mkdir(store.dir, { recursive: true });
      await writeFile(path.join(store.dir, name), data);
      store.byName.set(name, { size: data.length, hash: newHash });
      return name;
    }
    if (existing.size === data.length) {
      newHash ??= hashBytes(data);
      existing.hash ??= hashBytes(await readFile(path.join(store.dir, name)));
      if (existing.hash === newHash) {
        return name; // identical content already on disk, reuse it
      }
    }
  }
};

/**
 * *Options for {@link writeMaterialXPackage}.*
 *
 * @category Packaging
 */
export interface WriteMaterialXPackageOptions {
  /**
   * Loose `.mtlx` output only: directory that texture images are copied into instead of the
   * default `textures/` bucket next to the document. Relative (`../` allowed) resolves against
   * the output file's directory; absolute is used as-is. Ignored for `.mtlx.zip`, which always
   * uses `textures/` per the archive spec.
   */
  textureLibrary?: string;
}

/**
 * *Writes a package to disk in the format implied by `outputPath`'s extension.*
 *
 * `.mtlx.zip` produces a single archive file, always with textures under `textures/` inside it.
 * Any other path is treated as the root `.mtlx` document, with resources written beside it at
 * their archive-relative paths — `textures/` by default, or `options.textureLibrary` if given.
 *
 * @category Packaging
 */
export const writeMaterialXPackage = async (
  pkg: MaterialXPackage,
  outputPath: string,
  options: WriteMaterialXPackageOptions = {},
): Promise<WriteMaterialXPackageResult> => {
  const format = detectFormat(outputPath);
  const relocated = Boolean(options.textureLibrary) && format === 'mtlx';
  if (relocated) {
    relocateTextureResources(pkg, options.textureLibrary!);
  }
  await mkdir(path.dirname(outputPath), { recursive: true });

  if (format === 'mtlx') {
    const outputDir = path.dirname(outputPath);
    // A texture directory may already hold files from a previous run (the default `textures/`
    // next to the document, or a shared `--texture-library`), so each resource is deduplicated
    // against what's actually on disk rather than written blindly — see commitFile above. One
    // DedupStore per target directory, scanned once and reused across resources in this call.
    const stores = new Map<string, DedupStore>();
    for (const resource of pkg.resources) {
      const target = path.isAbsolute(resource.archivePath)
        ? path.resolve(resource.archivePath)
        : path.join(outputDir, ...resource.archivePath.split('/'));
      const dir = path.dirname(target);
      let store = stores.get(dir);
      if (!store) {
        store = await createDedupStore(dir);
        stores.set(dir, store);
      }
      const basename = path.basename(target);
      const extension = posixExtname(basename);
      const stem = extension ? basename.slice(0, -extension.length) : basename;
      const finalName = await commitFile(store, stem, extension, resource.data);
      if (finalName !== basename) {
        const slash = resource.archivePath.lastIndexOf('/');
        const newArchivePath = `${resource.archivePath.slice(0, slash + 1)}${finalName}`;
        rewriteResourcePath(pkg.document, resource.archivePath, newArchivePath);
        resource.archivePath = newArchivePath;
      }
    }
    // Relocated resources may carry an absolute or `..`-relative disk path, which is a valid
    // write target here but not a valid *archive* path, so validation is skipped for them.
    if (!relocated) {
      for (const p of [pkg.rootPath, ...pkg.resources.map((r) => r.archivePath)]) {
        const issue = validateArchivePath(p);
        if (issue) {
          throw new Error(`${issue}: ${p}`);
        }
      }
    }
    await writeFile(outputPath, serializeMaterialX(pkg.document), 'utf8');
    return {
      outputPath,
      rootPath: outputPath,
      format,
      entries: [path.basename(outputPath), ...pkg.resources.map((resource) => resource.archivePath)],
    };
  }

  const entries = packageToEntries(pkg);
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
