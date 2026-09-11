import type { MaterialXReadLimits } from './limits.js';
import {
  applyResourceDestinations,
  cloneMaterialXPackage,
  clearFilePrefixes,
  documentResourceReferences,
  planResourceDestinations,
  relativeResourcePath,
  resolveResourcePath,
} from './resource-graph.js';
import type { MaterialXDocument } from './types.js';
import { parseMaterialX, serializeMaterialX } from './xml.js';

/**
 * *A MaterialX file format, detected from its file extension.*
 *
 * - `mtlx` — a loose XML document with resources referenced by relative path.
 * - `mtlx.zip` — a relaxed, ordinary zip containing a `.mtlx` document plus resources.
 *
 * @category Packaging
 */
export type MaterialXFormat = 'mtlx' | 'mtlx.zip';

/**
 * *Detects the {@link MaterialXFormat} of a path from its extension.* Anything that is not
 * `.mtlx.zip` is treated as a loose `.mtlx` document, except `.mtlz`, which is rejected: the
 * bespoke `.mtlz` container format is no longer supported.
 *
 * @category Packaging
 */
export const detectFormat = (filePath: string): MaterialXFormat => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.mtlx.zip')) {
    return 'mtlx.zip';
  }
  if (lower.endsWith('.mtlz')) {
    throw new Error(`Unsupported format: .mtlz is no longer supported, use .mtlx or .mtlx.zip: ${filePath}`);
  }
  return 'mtlx';
};

/**
 * *One resource (texture, library, or other file) referenced by a MaterialX document.*
 *
 * `archivePath` is the normalized, archive-relative POSIX path (`textures/albedo.png`) that the
 * document now references; `sourcePath` is the path it was originally read from.
 *
 * @category Packaging
 */
export interface MaterialXResource {
  /** Stable identity in a resolved dependency graph. */
  id?: string;
  /** Canonical tree for an included MaterialX document; serialized on output. */
  document?: MaterialXDocument;
  archivePath: string;
  sourcePath: string;
  data: Uint8Array;
}

/**
 * *A MaterialX document together with every resource it references, held in memory.*
 *
 * This is the unit that {@link transform} pipelines operate on and that the Node entry point
 * (`mtlx-core/node`) reads from and writes to any of the three {@link MaterialXFormat}s. The
 * document's file references always point at `resources[i].archivePath`.
 *
 * Example:
 *
 * ```ts
 * import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
 * import { transform } from 'mtlx-core';
 * import { resizeTextures } from 'mtlx-core/textures';
 *
 * const pkg = await loadMaterialXPackage('material.mtlx');
 * await transform(pkg, resizeTextures({ maxImageSize: 1024, imageFormat: 'webp' }));
 * await writeMaterialXPackage(pkg, 'material.mtlx.zip');
 * ```
 *
 * @category Packaging
 */
export interface MaterialXPackage {
  /** Archive-relative path of the root `.mtlx` document, e.g. `material.mtlx`. */
  rootPath: string;
  document: MaterialXDocument;
  resources: MaterialXResource[];
}

/**
 * *A `{ path, data }` pair, the input to {@link createMaterialXZipArchive}.*
 *
 * @category Packaging
 */
export interface MaterialXPackageEntry {
  path: string;
  data: Uint8Array;
}

/**
 * *A step in a {@link transform} pipeline.* Transforms mutate the package in place and may be
 * async. Functions that take options return a Transform, so they read as a declarative list:
 *
 * ```ts
 * await transform(pkg, resizeTextures({ maxImageSize: 2048 }), myCustomTransform);
 * ```
 *
 * @category Transforms
 */
export type Transform = (pkg: MaterialXPackage) => void | Promise<void>;

/**
 * *Applies transforms to a package in order, awaiting each one.* Returns the same package for
 * chaining.
 *
 * @category Transforms
 */
export const transform = async (pkg: MaterialXPackage, ...transforms: Transform[]): Promise<MaterialXPackage> => {
  for (const step of transforms) {
    await step(pkg);
  }
  return pkg;
};

// --- pure POSIX path helpers (no node:path so this module stays browser-safe) ---

export const posixBasename = (filePath: string): string => filePath.slice(filePath.lastIndexOf('/') + 1);

/** `.png` for `textures/a.png`, `''` when there is no extension. */
export const posixExtname = (filePath: string): string => {
  const basename = posixBasename(filePath);
  const dot = basename.lastIndexOf('.');
  return dot > 0 ? basename.slice(dot) : '';
};

/** Swaps the extension of a path when `extension` differs from the current one. */
export const withExtension = (filePath: string, extension: string): string => {
  const current = posixExtname(filePath);
  if (current.toLowerCase() === extension.toLowerCase()) {
    return filePath;
  }
  return `${current ? filePath.slice(0, -current.length) : filePath}${extension}`;
};

/** Returns a reason string when an archive path is unsafe to extract, else `undefined`. */
export const validateArchivePath = (entryPath: string): string | undefined => {
  if (!entryPath || entryPath.startsWith('/') || entryPath.includes('\\') || /^[a-z]:/i.test(entryPath)) {
    return 'Archive entry paths must be relative POSIX paths';
  }
  const segments = entryPath.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return 'Archive entry paths must not contain empty, current, or parent segments';
  }
  return undefined;
};

const imageExtensions = new Set([
  '.avif',
  '.bmp',
  '.exr',
  '.gif',
  '.hdr',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.tga',
  '.tif',
  '.tiff',
  '.tx',
  '.webp',
]);

export const isImagePath = (filePath: string): boolean => imageExtensions.has(posixExtname(filePath).toLowerCase());

const isExternalReference = (value: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(value);
const isAbsoluteReference = (value: string): boolean => value.startsWith('/') || /^[a-z]:[\\/]/i.test(value);

const resourceDirectoryFor = (sourcePath: string): string => {
  if (isImagePath(sourcePath)) {
    return 'textures';
  }
  if (posixExtname(sourcePath).toLowerCase() === '.mtlx') {
    return 'libraries';
  }
  return 'resources';
};

const safeBasename = (sourcePath: string): string =>
  posixBasename(sourcePath).replace(/[^a-zA-Z0-9._-]/g, '_') || 'resource';

const uniqueArchivePath = (directory: string, basename: string, used: Set<string>): string => {
  const extension = posixExtname(basename);
  const stem = extension ? basename.slice(0, -extension.length) : basename;
  let archivePath = `${directory}/${basename}`;
  for (let suffix = 2; used.has(archivePath); suffix += 1) {
    archivePath = `${directory}/${stem}-${suffix}${extension}`;
  }
  used.add(archivePath);
  return archivePath;
};

/**
 * *Reads the bytes of a resource referenced by a document, given its normalized root-relative
 * POSIX path.* Callers supply this so the library never touches a filesystem itself: the Node
 * entry point wraps `fs.readFile`, a browser can serve entries from an unzipped archive.
 *
 * @category Packaging
 */
export type ResourceReader = (relativePath: string) => Promise<Uint8Array>;

/**
 * *Collects every file referenced by a document and rewrites the references to archive paths.*
 *
 * Walks `file`/`filename`/`href`/`uri`/`source` attributes and any `type="filename"` value,
 * rejects external (`http:`), absolute, or root-escaping references, reads each unique file via
 * `readResource`, assigns it an archive path under `textures/`, `libraries/`, or `resources/`,
 * and rewrites the document's attributes in place to those paths.
 *
 * Example:
 *
 * ```ts
 * const resources = await resolveMaterialXResources(document, (rel) => readFile(path.join(rootDir, rel)));
 * ```
 *
 * @category Packaging
 */
export const resolveMaterialXResources = async (
  document: MaterialXDocument,
  readResource: ResourceReader,
  options: { rootPath?: string; limits?: Partial<MaterialXReadLimits> } = {},
): Promise<MaterialXResource[]> => {
  const rootSource = options.rootPath ?? 'material.mtlx';
  const rootDestination = posixBasename(rootSource);
  const resources = new Map<string, MaterialXResource>();
  const visiting = new Set<string>([rootSource]);
  const edges: Array<{ owner: string; ref: ReturnType<typeof documentResourceReferences>[number]; target: string }> =
    [];
  const visit = async (owner: string, doc: MaterialXDocument): Promise<void> => {
    for (const ref of documentResourceReferences(doc)) {
      const value = ref.resolvedValue.trim();
      if (isAbsoluteReference(value)) throw new Error(`Absolute references cannot be packaged: ${value}`);
      if (isExternalReference(value)) throw new Error(`External references cannot be packaged: ${value}`);
      const target = resolveResourcePath(owner, value);
      edges.push({ owner, ref, target });
      if (visiting.has(target)) throw new Error(`MaterialX include cycle: ${[...visiting, target].join(' -> ')}`);
      if (resources.has(target)) continue;
      let data: Uint8Array;
      try {
        data = await readResource(target);
      } catch {
        throw new Error(`Referenced file does not exist: ${target}`);
      }
      const resource: MaterialXResource = { id: target, archivePath: '', sourcePath: target, data };
      resources.set(target, resource);
      if (posixExtname(target).toLowerCase() === '.mtlx') {
        resource.document = parseMaterialX(new TextDecoder().decode(data), options.limits);
        visiting.add(target);
        await visit(target, resource.document);
        visiting.delete(target);
      }
    }
  };
  await visit(rootSource, document);
  const used = new Set([rootDestination]);
  for (const resource of resources.values()) {
    resource.archivePath = uniqueArchivePath(
      resourceDirectoryFor(resource.sourcePath),
      safeBasename(resource.sourcePath),
      used,
    );
  }
  // No mutation until dependency closure and every destination have been computed successfully.
  for (const edge of edges) {
    const owner = edge.owner === rootSource ? rootDestination : resources.get(edge.owner)!.archivePath;
    edge.ref.element.attributes[edge.ref.attribute] = relativeResourcePath(
      owner,
      resources.get(edge.target)!.archivePath,
    );
  }
  clearFilePrefixes(document);
  for (const resource of resources.values()) {
    if (resource.document) clearFilePrefixes(resource.document);
    if (resource.document) resource.data = new TextEncoder().encode(serializeMaterialX(resource.document));
  }
  return [...resources.values()].toSorted((a, b) => a.archivePath.localeCompare(b.archivePath));
};

/**
 * *Rewrites every attribute equal to `from` to `to`, returning how many were changed.* Use this
 * when a transform renames a resource (e.g. `textures/a.png` → `textures/a.webp`).
 *
 * @category Transforms
 */
export const rewriteResourcePath = (document: MaterialXDocument, from: string, to: string): number => {
  let count = 0;
  for (const ref of documentResourceReferences(document)) {
    ref.element.attributes[ref.attribute] = ref.resolvedValue === from ? to : ref.resolvedValue;
    if (ref.resolvedValue === from) count++;
  }
  clearFilePrefixes(document);
  return count;
};

/**
 * *Moves every image resource's archive path under `libraryPath`, rewriting document references
 * to match.* Used for loose `.mtlx` output when `--texture-library` is given; irrelevant to
 * `.mtlx.zip`, which always uses `textures/` per the archive spec. Non-image resources (other
 * `.mtlx` libraries, misc files) are left where they are.
 *
 * @category Packaging
 */
export const relocateTextureResources = (pkg: MaterialXPackage, libraryPath: string): void => {
  const directory = libraryPath.replace(/\\/g, '/').replace(/\/+$/, '') || '.';
  const destinations = planResourceDestinations(pkg, (resource) =>
    isImagePath(resource.archivePath) ? `${directory}/${posixBasename(resource.archivePath)}` : resource.archivePath,
  );
  applyResourceDestinations(pkg, destinations);
};

/**
 * *Flattens a package into `{ path, data }` entries, root document first.* By default throws on
 * unsafe archive paths so nothing downstream can write outside its target directory — pass
 * `{ validate: false }` only for loose `.mtlx` output whose resources were deliberately relocated
 * (e.g. via {@link relocateTextureResources}) to an absolute or `..`-relative disk path, which is
 * not a valid *archive* path but is a valid write target on a real filesystem.
 *
 * @category Packaging
 */
export const packageToEntries = (
  pkg: MaterialXPackage,
  options: { validate?: boolean } = {},
): MaterialXPackageEntry[] => {
  const entries = [
    { path: pkg.rootPath, data: new TextEncoder().encode(serializeMaterialX(pkg.document)) },
    ...pkg.resources.map((resource) => ({
      path: resource.archivePath,
      data: resource.document ? new TextEncoder().encode(serializeMaterialX(resource.document)) : resource.data,
    })),
  ];
  if (options.validate ?? true) {
    for (const entry of entries) {
      const issue = validateArchivePath(entry.path);
      if (issue) {
        throw new Error(`${issue}: ${entry.path}`);
      }
    }
  }
  return entries;
};

/**
 * *Combines multiple packages into one, root document first.* Resources are concatenated,
 * renaming (and rewriting references to) any archive path that collides with one already taken.
 * Throws if two inputs share a top-level element name (materials, nodegraphs, etc.), since
 * MaterialX names must be unique within a document and there's no safe way to rename one without
 * also rewriting every reference to it.
 *
 * A single-package input is returned as-is.
 *
 * @category Packaging
 */
export const mergeMaterialXPackages = (packages: MaterialXPackage[]): MaterialXPackage => {
  if (packages.length === 0) {
    throw new Error('No input files to merge');
  }
  const [first, ...rest] = packages as [MaterialXPackage, ...MaterialXPackage[]];
  if (rest.length === 0) {
    return first;
  }

  const usedNames = new Set(
    first.document.elements.map((element) => element.attributes.name).filter((name): name is string => !!name),
  );
  const usedArchivePaths = new Set([first.rootPath, ...first.resources.map((resource) => resource.archivePath)]);

  const merged = cloneMaterialXPackage(first);

  for (const input of rest) {
    const pkg = cloneMaterialXPackage(input);
    for (const element of pkg.document.elements) {
      const name = element.attributes.name;
      if (name && usedNames.has(name)) {
        throw new Error(`Cannot combine inputs: duplicate top-level name "${name}"`);
      }
      if (name) {
        usedNames.add(name);
      }
    }
    const destinations = planResourceDestinations(pkg, (resource) => resource.archivePath, usedArchivePaths);
    applyResourceDestinations(pkg, destinations, merged.rootPath);
    for (const resource of pkg.resources) {
      usedArchivePaths.add(resource.archivePath);
      resource.id = `merged:${merged.resources.length}:${resource.id ?? resource.sourcePath}`;
      merged.resources.push(resource);
    }
    merged.document.elements.push(...pkg.document.elements);
  }

  return merged;
};

/**
 * *Builds a package from an inspected archive.* Accepts the result of
 * {@link inspectMaterialXZipArchive}; throws if the archive reported errors or has no root
 * document.
 *
 * @category Packaging
 */
export const packageFromArchive = (
  archive: {
    entries: Array<{ path: string; data: Uint8Array; isDirectory?: boolean }>;
    rootEntry?: { path: string; data: Uint8Array };
    issues: Array<{ level: string; location: string; message: string }>;
  },
  options: { limits?: Partial<MaterialXReadLimits> } = {},
): MaterialXPackage => {
  const errors = archive.issues.filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((issue) => `${issue.location}: ${issue.message}`).join('\n'));
  }
  if (!archive.rootEntry) {
    throw new Error('Archive does not contain a root .mtlx file');
  }
  const paths = archive.entries.filter((entry) => !entry.isDirectory).map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate package entry path');
  const rootIssue = validateArchivePath(archive.rootEntry.path);
  if (rootIssue) throw new Error(`${rootIssue}: ${archive.rootEntry.path}`);
  const resources = archive.entries
    .filter((entry) => !entry.isDirectory && entry.path !== archive.rootEntry!.path)
    .map((entry) => {
      const issue = validateArchivePath(entry.path);
      if (issue) {
        throw new Error(`${issue}: ${entry.path}`);
      }
      return {
        id: entry.path,
        archivePath: entry.path,
        sourcePath: entry.path,
        data: entry.data,
        ...(entry.path.toLowerCase().endsWith('.mtlx')
          ? { document: parseMaterialX(new TextDecoder().decode(entry.data), options.limits) }
          : {}),
      };
    });
  return {
    rootPath: archive.rootEntry.path,
    document: parseMaterialX(new TextDecoder().decode(archive.rootEntry.data), options.limits),
    resources,
  };
};
