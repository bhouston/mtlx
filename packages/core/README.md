# mtlx-core

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux.

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

## `mtlx-core` (root, browser-safe)

Pure: no filesystem, no `Buffer`, no native modules. Runs in Node, the browser (the
[mtlx.ben3d.ca](https://mtlx.ben3d.ca) viewer uses it), and workers. Platform resources are passed
in by the caller, never created by the library.

```ts
import {
  checkMaterialXZipArchive,
  detectFormat,
  materialXNodeRegistry,
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

// Round-trip is lossless: parse -> serialize -> parse.
const xmlOut = serializeMaterialX(document);

// Inspect: version, colorspace, materials, referenced textures, nodes.
const summary = summarizeMaterialX('material.mtlx', document);
console.log(summary.materials.map((material) => material.name));

// Check a whole .mtlx.zip archive's bytes (container checks + the document inside).
const archiveIssues = checkMaterialXZipArchive(new Uint8Array(await file.arrayBuffer()));

// 'mtlx' | 'mtlx.zip', picked from the file extension.
detectFormat('material.mtlx.zip');

// The full built-in MaterialX node spec registry (for tooling, autocomplete, etc).
materialXNodeRegistry; // MaterialXNodeSpec[]

// Resolve a document's file/filename/href/uri/source references via your own reader —
// the library never reads a filesystem itself.
const resources = await resolveMaterialXResources(document, async (relativePath) => {
  return new Uint8Array(await (await fetch(relativePath)).arrayBuffer());
});

// Run transforms over a package in order.
await transform(pkg, resizeTextures({ maxImageSize: 2048 }));

// If a transform renames a resource, keep the document's references in sync.
rewriteResourcePath(document, 'textures/old.png', 'textures/new.png');
```

Writing your own transform is the same shape:

```ts
import type { Transform } from 'mtlx-core';

const stripComments: Transform = (pkg) => {
  pkg.document.elements = pkg.document.elements.filter((element) => element.name !== '#comment');
};
```

## `mtlx-core/node` (filesystem helpers)

Thin wrappers over `node:fs` that hand bytes to the pure root entry.

```ts
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
const { document, rootPath, format } = await loadMaterialXDocument('material.mtlx.zip');

// Load a full package (document + resources) from either format...
const pkg = await loadMaterialXPackage('material.mtlx');
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp' }));
// ...and write it back out as either — the extension picks the format. Packing and
// unpacking are just a load followed by a write to the other extension.
await writeMaterialXPackage(pkg, 'material.mtlx.zip');

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
const { data, format } = await transformImage(pngBytes, { maxImageSize: 1024, imageFormat: 'avif' });
```

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
