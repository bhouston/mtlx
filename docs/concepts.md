---
title: Concepts
group: Guides
---

# Concepts

mtlx works with three on-disk forms of the same thing, and one in-memory model for all of them.

## Formats

| Format      | What it is                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `.mtlx`     | A loose XML document. Textures and libraries are referenced by relative path.                     |
| `.mtlz`     | The spec-compliant single-file container: ZIP32, STORE-only, root `.mtlx` first, 64-byte aligned. |
| `.mtlx.zip` | A relaxed container: any ordinary zip with a `.mtlx` inside. Convenient, but not the spec.        |

`detectFormat(path)` picks one from the extension. Every loader and writer in `mtlx-core/node`
dispatches on it, so callers rarely need to branch on format themselves.

## Documents

`parseMaterialX(xml)` turns text into a `MaterialXDocument`. The document keeps two views of the
same data:

- `nodes` and `nodeGraphs`: typed, convenient for reading materials, inputs, and outputs.
- `elements`: the raw element tree with every attribute preserved. `serializeMaterialX` writes
  this back out, so parse → serialize → parse is lossless.

Validation never throws. `validateDocument` returns a list of `MaterialXValidationIssue`, each
`error` or `warning`, and `checkMaterialXText` folds parse failures into that same list.

## Packages

A `MaterialXPackage` is a document plus every resource it references, held in memory:

```ts
interface MaterialXPackage {
  rootPath: string; // 'material.mtlx'
  document: MaterialXDocument;
  resources: MaterialXResource[]; // { archivePath, sourcePath, data }
}
```

Loading a loose `.mtlx` resolves each `file`, `filename`, `href`, `uri`, or `source` reference,
reads it, and rewrites the reference to a normalized archive path (`textures/albedo.png`,
`libraries/foo.mtlx`, `resources/other.bin`). Loading an archive uses its entries directly. Either
way, once you hold a package the format it came from no longer matters, and it can be written back
out as any of the three.

## Transforms

A `Transform` is a function from a package to nothing. Transforms mutate the package in place and
may be async. Functions that take options return a transform, so pipelines read as a list:

```ts
import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';

const pkg = await loadMaterialXPackage('material.mtlx');
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp' }));
await writeMaterialXPackage(pkg, 'material.mtlz');
```

Writing your own is the same shape:

```ts
import type { Transform } from 'mtlx-core';

const stripComments: Transform = (pkg) => {
  pkg.document.elements = pkg.document.elements.filter((element) => element.name !== '#comment');
};
```

If a transform renames a resource, call `rewriteResourcePath(document, from, to)` so the document
stays consistent with `resources`.

## Node and browser

The root `mtlx-core` entry is pure: no filesystem, no `Buffer`, no native modules. It runs in the
browser (the viewer at [mtlx.ben3d.ca](https://mtlx.ben3d.ca) uses it) and in workers. Platform
resources are passed in by the caller, never created by the library; `resolveMaterialXResources`
takes a `ResourceReader` callback rather than reading files itself.

- `mtlx-core/node` adds the filesystem helpers: `loadMaterialXPackage`, `writeMaterialXPackage`,
  `packMaterialX`, `unpackMaterialX`, `checkMaterialX`.
- `mtlx-core/textures` adds `resizeTextures` and `transformImage`, backed by
  [sharp](https://sharp.pixelplumbing.com/). It is Node-only.
