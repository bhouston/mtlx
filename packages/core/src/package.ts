import type { MaterialXDocument, MaterialXElement } from './types.js';
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

const resourceExtensions = new Set([...imageExtensions, '.mtlx', '.json', '.bin', '.txt']);

export const isImagePath = (filePath: string): boolean => imageExtensions.has(posixExtname(filePath).toLowerCase());

const isExternalReference = (value: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(value);
const isAbsoluteReference = (value: string): boolean => value.startsWith('/') || /^[a-z]:[\\/]/i.test(value);

/**
 * Normalizes `./a/../b/c.png` to `b/c.png`. A `..` that runs past the start (`../textures/x.png`)
 * is kept rather than rejected: nothing in the MaterialX spec confines a relative reference to the
 * document's own directory, and real content legitimately shares files across sibling directories
 * this way — the caller's {@link ResourceReader} resolves it exactly like any other relative disk
 * path. This is distinct from {@link validateArchivePath}, which does reject `..` because it
 * guards *archive* entries (extracting a `.mtlx.zip` can't be allowed to write outside its target
 * directory, a classic zip-slip).
 */
const normalizeReference = (value: string): string => {
  const segments: string[] = [];
  for (const segment of value.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (segments.length > 0 && segments[segments.length - 1] !== '..') {
        segments.pop();
      } else {
        segments.push('..');
      }
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
};

const shouldConsiderReference = (element: MaterialXElement, attributeName: string, value: string): boolean => {
  const name = attributeName.toLowerCase();
  if (element.attributes.type === 'filename' && name === 'value') {
    return true;
  }
  if (['file', 'filename', 'href', 'uri', 'source'].includes(name)) {
    return true;
  }
  if (name === 'value') {
    return value.includes('/') || resourceExtensions.has(posixExtname(value).toLowerCase());
  }
  return false;
};

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
): Promise<MaterialXResource[]> => {
  const refs: Array<{ element: MaterialXElement; attributeName: string; sourcePath: string }> = [];
  const sourcePaths: string[] = [];

  const collectElement = (element: MaterialXElement) => {
    for (const [attributeName, rawValue] of Object.entries(element.attributes)) {
      const value = rawValue.trim();
      if (!value || !shouldConsiderReference(element, attributeName, value)) {
        continue;
      }
      if (isAbsoluteReference(value)) {
        throw new Error(`Absolute references cannot be packaged: ${value}`);
      }
      if (isExternalReference(value)) {
        throw new Error(`External references cannot be packaged: ${value}`);
      }
      const sourcePath = normalizeReference(value);
      refs.push({ element, attributeName, sourcePath });
      if (!sourcePaths.includes(sourcePath)) {
        sourcePaths.push(sourcePath);
      }
    }
    for (const child of element.children) {
      collectElement(child);
    }
  };
  for (const element of document.elements) {
    collectElement(element);
  }

  const used = new Set<string>();
  const bySourcePath = new Map<string, MaterialXResource>();
  for (const sourcePath of sourcePaths) {
    let data: Uint8Array;
    try {
      data = await readResource(sourcePath);
    } catch {
      throw new Error(`Referenced file does not exist: ${sourcePath}`);
    }
    const archivePath = uniqueArchivePath(resourceDirectoryFor(sourcePath), safeBasename(sourcePath), used);
    bySourcePath.set(sourcePath, { archivePath, sourcePath, data });
  }

  for (const ref of refs) {
    ref.element.attributes[ref.attributeName] = bySourcePath.get(ref.sourcePath)!.archivePath;
  }

  return [...bySourcePath.values()].toSorted((left, right) => left.archivePath.localeCompare(right.archivePath));
};

/**
 * *Rewrites every attribute equal to `from` to `to`, returning how many were changed.* Use this
 * when a transform renames a resource (e.g. `textures/a.png` → `textures/a.webp`).
 *
 * @category Transforms
 */
export const rewriteResourcePath = (document: MaterialXDocument, from: string, to: string): number => {
  let count = 0;
  const visit = (element: MaterialXElement) => {
    for (const [name, value] of Object.entries(element.attributes)) {
      if (value === from) {
        element.attributes[name] = to;
        count += 1;
      }
    }
    element.children.forEach(visit);
  };
  document.elements.forEach(visit);
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
  const used = new Set(pkg.resources.map((resource) => resource.archivePath));
  for (const resource of pkg.resources) {
    if (!isImagePath(resource.archivePath)) {
      continue;
    }
    used.delete(resource.archivePath);
    const archivePath = uniqueArchivePath(directory, posixBasename(resource.archivePath), used);
    if (archivePath !== resource.archivePath) {
      rewriteResourcePath(pkg.document, resource.archivePath, archivePath);
      resource.archivePath = archivePath;
    }
  }
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
    ...pkg.resources.map((resource) => ({ path: resource.archivePath, data: resource.data })),
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
  const usedArchivePaths = new Set(first.resources.map((resource) => resource.archivePath));

  const merged: MaterialXPackage = {
    rootPath: first.rootPath,
    document: { ...first.document, elements: [...first.document.elements] },
    resources: [...first.resources],
  };

  for (const pkg of rest) {
    for (const element of pkg.document.elements) {
      const name = element.attributes.name;
      if (name && usedNames.has(name)) {
        throw new Error(`Cannot combine inputs: duplicate top-level name "${name}"`);
      }
      if (name) {
        usedNames.add(name);
      }
    }
    for (const resource of pkg.resources) {
      let { archivePath } = resource;
      if (usedArchivePaths.has(archivePath)) {
        const slash = archivePath.lastIndexOf('/');
        const directory = archivePath.slice(0, slash);
        const basename = archivePath.slice(slash + 1);
        const renamed = uniqueArchivePath(directory, basename, usedArchivePaths);
        rewriteResourcePath(pkg.document, archivePath, renamed);
        archivePath = renamed;
      } else {
        usedArchivePaths.add(archivePath);
      }
      merged.resources.push({ ...resource, archivePath });
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
export const packageFromArchive = (archive: {
  entries: Array<{ path: string; data: Uint8Array; isDirectory?: boolean }>;
  rootEntry?: { path: string; data: Uint8Array };
  issues: Array<{ level: string; location: string; message: string }>;
}): MaterialXPackage => {
  const errors = archive.issues.filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((issue) => `${issue.location}: ${issue.message}`).join('\n'));
  }
  if (!archive.rootEntry) {
    throw new Error('Archive does not contain a root .mtlx file');
  }
  const resources = archive.entries
    .filter((entry) => !entry.isDirectory && entry !== archive.rootEntry)
    .map((entry) => {
      const issue = validateArchivePath(entry.path);
      if (issue) {
        throw new Error(`${issue}: ${entry.path}`);
      }
      return { archivePath: entry.path, sourcePath: entry.path, data: entry.data };
    });
  return {
    rootPath: archive.rootEntry.path,
    document: parseMaterialX(new TextDecoder().decode(archive.rootEntry.data)),
    resources,
  };
};
