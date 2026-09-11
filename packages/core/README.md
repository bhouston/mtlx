# mtlx-core

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite. The root TypeScript/JavaScript
API runs on bytes and text in browsers and Node. Filesystem helpers and native sharp texture
processing are exposed through separate Node-only subpaths. Installing this package also installs
sharp; keeping it out of browser bundles does not make the npm dependency native-free.

```sh
npm install mtlx-core
```

## Concepts

mtlx works with two on-disk forms of the same thing, and one in-memory model for both.

| Format      | What it is                                                                    |
| ----------- | ----------------------------------------------------------------------------- |
| `.mtlx`     | A loose XML document. Textures and libraries are referenced by relative path. |
| `.mtlx.zip` | A relaxed container: any ordinary zip with a `.mtlx` inside.                  |

A `MaterialXPackage` is a document plus every resource it references, held in memory:

```ts
interface MaterialXPackage {
  rootPath: string; // 'material.mtlx'
  document: MaterialXDocument;
  resources: MaterialXResource[]; // { archivePath, sourcePath, data }
}
```

Once you hold a package the format it came from no longer matters — it can be written back out as
either. A `Transform` is a function from a package to nothing (`(pkg) => void | Promise<void>`);
transforms mutate the package in place and compose with `transform(pkg, ...transforms)`.

`document.elements` is the canonical mutable element tree. `document.nodes` and
`document.nodeGraphs` are derived readonly snapshots for inspection: edit the canonical elements
and read a new snapshot afterward. The snapshots are frozen at runtime as well as readonly in
TypeScript. Use `createMaterialXDocument(attributes, elements)` to construct a document and
`cloneMaterialXDocument(document)` to copy it; do not spread a document to make an editable copy.

Parsing malformed XML throws. Validation of a parsed document returns issues; use
`checkMaterialXText` when you want parsing failures reported as issues as well. Validation covers
selected rules, not complete MaterialX conformance or shader compilation.

## `mtlx-core` (root, browser-safe)

Pure: no filesystem, no `Buffer`, no native modules. Runs in Node, the browser (the
[mtlx.ben3d.ca](https://mtlx.ben3d.ca) viewer uses it), and workers. Platform resources are passed
in by the caller, never created by the library.

```ts
import {
  checkMaterialXZipArchive,
  detectFormat,
  materialXNodeRegistry,
  mergeMaterialXPackages,
  parseMaterialX,
  resolveMaterialXResources,
  rewriteResourcePath,
  serializeMaterialX,
  summarizeMaterialX,
  transform,
  validateDocument,
} from 'mtlx-core';

// Parse XML text and validate it. Validation never throws — it returns issues.
const document = parseMaterialX(xmlText);
const issues = validateDocument(document); // MaterialXValidationIssue[] ({ level, location, message })

// Preserves semantic element order, attributes, comments, and text.
// Formatting, quote style, and XML declaration spelling may change.
const xmlOut = serializeMaterialX(document);

// Inspect: version, colorspace, materials, referenced textures, nodes.
const summary = summarizeMaterialX('material.mtlx', document);
console.log(summary.materials.map((material) => material.name));

// Check a whole .mtlx.zip archive's bytes (container checks + the document inside).
const archiveIssues = checkMaterialXZipArchive(new Uint8Array(await file.arrayBuffer()));

// 'mtlx' | 'mtlx.zip', picked from the file extension.
detectFormat('material.mtlx.zip');

// Generated built-in node specifications for tooling; not a renderer capability guarantee.
materialXNodeRegistry; // MaterialXNodeSpec[]

// Resolve a document's file/filename/href/uri/source references via your own reader —
// the library never reads a filesystem itself.
const resources = await resolveMaterialXResources(document, async (relativePath) => {
  return new Uint8Array(await (await fetch(relativePath)).arrayBuffer());
});

// Run transforms over a package in order.
await transform(pkg, (material) => {
  material.document.attributes.doc = 'Prepared for review';
});

// If a transform renames a resource, keep the document's references in sync.
rewriteResourcePath(document, 'textures/old.png', 'textures/new.png');

// Combine multiple packages into one, renaming any colliding resource archive path;
// throws if two inputs share a top-level element name.
const combined = mergeMaterialXPackages([metalPkg, woodPkg, glassPkg]);
```

Writing your own transform is the same shape:

```ts
import type { Transform } from 'mtlx-core';

const stripComments: Transform = (pkg) => {
  pkg.document.elements = pkg.document.elements.filter((element) => element.name !== '#comment');
};
```

## `mtlx-core/node` (filesystem helpers)

Filesystem loading, dependency resolution, and staged output commits. Reads support parent-relative
resources and inherited `fileprefix`; recursive includes are packaged with their own resources.
Multi-input merges and writes preserve their input packages. File transforms mutate their input.

`checkMaterialX` and `checkMaterialXZipArchive` default to basic, structure, and resource checks.
`validateDocument` and CLI `check` default to basic checks; select rule groups explicitly for CI.

```ts
import { transform } from 'mtlx-core';
import { resizeTextures } from 'mtlx-core/textures';
import {
  checkMaterialX,
  loadMaterialXDocument,
  loadMaterialXPackage,
  readMaterialX,
  writeMaterialX,
  writeMaterialXPackage,
} from 'mtlx-core/node';

// Read/write a loose .mtlx document (no resources).
const document = await readMaterialX('material.mtlx');
await writeMaterialX('out.mtlx', document);

// Read just the document from either format (skip loading resources).
const { document: loadedDocument, rootPath, format } = await loadMaterialXDocument('material.mtlx.zip');

// Load a full package (document + resources) from either format...
const pkg = await loadMaterialXPackage('material.mtlx');
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp' }));
// ...and write it back out as either — the extension picks the format. Packing and
// unpacking are just a load followed by a write to the other extension.
await writeMaterialXPackage(pkg, 'material.mtlx.zip');

// Loose .mtlx output only: put textures under a chosen directory (relative — '../' allowed — or
// absolute) instead of the default textures/ bucket. References are written relative to the
// output document; the selected library must share its filesystem drive. Ignored for .mtlx.zip. Writing is content-deduplicated against whatever's already in that directory: a
// same-named file with identical bytes is reused, one with different bytes gets a -2 suffix
// instead of being overwritten.
await writeMaterialXPackage(pkg, 'out/material.mtlx', { textureLibrary: '../shared-textures' });

// Validate a file on disk without throwing; works as a CI gate.
const { issues } = await checkMaterialX('material.mtlx.zip');
process.exitCode = issues.some((issue) => issue.level === 'error') ? 1 : 0;
```

## `mtlx-core/textures` (Node-only, needs sharp)

Backed by [sharp](https://sharp.pixelplumbing.com/); never pulled into a browser bundle.

```ts
import { resizeTextures, transformImage, TRANSFORM_IMAGE_DEFAULTS } from 'mtlx-core/textures';

// A Transform that resizes/reformats every texture resource in a package.
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp', imageQuality: 90 }));

// Or transform a single image's bytes directly.
const { data, extension } = await transformImage(pngBytes, '.png', { maxImageSize: 1024, imageFormat: 'avif' });
```

See [Processing pipelines](https://github.com/bhouston/mtlx/blob/main/packages/core/PROCESSING.md) for `processMaterialX`, staged results, and dry-run planning.

## Planning and safe output

`planMaterialXPackageWrite(pkg, outputPath, options)` reads existing destinations and returns a
plan without writing or mutating the package. `commitMaterialXPackageWrite(plan)` checks that
destinations have not changed, stages every write, then publishes resources and the root last.
The convenience writer performs both steps. Existing root outputs are replaced unless
`overwrite: false`; resource content is reused or assigned a unique filename.

Unsafe archive paths and output symlinks are rejected before writes, even with a texture-library
override. Standard macOS `/var`, `/tmp`, and `/etc` aliases are accepted. Concurrent hostile
filesystem mutation is not sandboxed; a crash can leave orphan resources, but not a partly written
root document. Read budgets apply to XML and every included document; see
[resource limits](https://github.com/bhouston/mtlx/blob/main/packages/core/READ_LIMITS.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
