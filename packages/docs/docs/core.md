---
title: Core library
---

`mtlx-core` is the document and package layer. The root API works with text and bytes in browsers and Node. Filesystem helpers and native texture processing are separate Node-only subpaths.

```sh
npm install mtlx-core
```

```ts
import { parseMaterialX, serializeMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';

const session = createEditorSession({
  document: parseMaterialX('<materialx version="1.39"/>'),
});
const graph = session.graph('');
const node = graph.addNode({ definition: 'ND_constant_color3' });
graph.setInputValue(node, 'value', [0.8, 0.2, 0.1], { type: 'color3' });
console.log(serializeMaterialX(session.getDocument()));
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

## Headless editing

`mtlx-core/session` is the primary manipulation interface. It has no React, DOM, or
Three.js dependency, and works in JavaScript as well as TypeScript. The UI uses the same
operations as scripts; the session owns the current document, validation, subscriptions,
and undo/redo. Low-level immutable graph transforms are also exported from this subpath.
They do not provide the session's complete validation and history contract.

```ts
import { parseMaterialX, serializeMaterialX } from 'mtlx-core';
import { createEditorSession, EditorError } from 'mtlx-core/session';

const editor = createEditorSession({ document: parseMaterialX('<materialx version="1.39"/>') });
const graph = editor.graph(''); // Use 'group/nested' for a nested graph.

try {
  editor.transaction('Build multiplier', () => {
    const color = graph.addNode({ definition: 'ND_constant_color3' });
    const multiply = graph.addNode({ definition: 'ND_multiply_color3' });
    graph.setInputValue(color, 'value', [0.8, 0.2, 0.1], { type: 'color3' });
    graph.connect({ node: color, output: 'out' }, { node: multiply, input: 'in1' });
  });
} catch (error) {
  if (error instanceof EditorError) console.error(error.code, error.message);
  else throw error;
}

const xml = serializeMaterialX(editor.getDocument());
```

Use `graph.addNode`, `setInputValue`, `connect`, `disconnectInput`, and `removeNodes` to edit a graph. Invalid operations throw `EditorError`; use `checkConnection` to validate a proposed connection without changing the document. Graph scopes use names such as `group/nested`.

Each successful edit creates an immutable document snapshot. Use `editor.subscribe(listener)` for updates and call the returned function to unsubscribe. `editor.undo()` and `editor.redo()` navigate history; `historyLimit` defaults to 50 entries. `replaceDocument(document)` loads a document and clears history.

Transactions are synchronous and group changes into one undo entry. An uncaught error rolls back the transaction. Load resources before starting a transaction. Use `cloneMaterialXDocument(editor.getDocument())` when an API needs a mutable document.

`editor.toXml()` serializes the current document. `dirty` tracks changes since loading or `markClean()`. Set node positions through `editor.layout.moveNodes({ [id]: { x, y } }, scope)` when your application needs persisted layout.

## Complete inspection

`inspectMaterialX` runs all five rule groups. ZIP inputs supply their own resource inventory;
for loose XML, pass a `readResource(path)` callback to check recursive dependencies. Missing
resources are collected independently. `resourcesChecked` records whether dependency checks
could run, and `resourcePaths` includes failed reads. Pass `supportedCategories` from your renderer
for category coverage; shader compilation remains the renderer's job.

<!-- test:inspection -->

```ts
import { inspectMaterialX } from 'mtlx-core';

const bytes = new TextEncoder().encode('<materialx version="1.39"/>');
const report = await inspectMaterialX(bytes, 'material.mtlx', { supportedCategories: [] });
if (report.issues.some((issue) => issue.level === 'error')) throw new Error('Material checks failed');
console.log(report.resourcesChecked); // true: no dependencies to resolve
```

## `mtlx-core/node` (filesystem helpers)

Load a loose document with its referenced resources, or read a ZIP package, then write either format. The output extension selects the format:

```ts
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';

const pkg = await loadMaterialXPackage('material.mtlx');
await writeMaterialXPackage(pkg, 'material.mtlx.zip');
```

For shared textures with loose output, pass `{ textureLibrary: '../textures' }` to `writeMaterialXPackage`. ZIP output keeps resources inside the archive. Use `readMaterialX` / `writeMaterialX` when you only need XML, or `checkMaterialX` to validate a file on disk.

## `mtlx-core/textures` (Node-only, needs sharp)

Backed by [sharp](https://sharp.pixelplumbing.com/); never pulled into a browser bundle.

```ts
import { transform } from 'mtlx-core';
import { resizeTextures } from 'mtlx-core/textures';

await transform(pkg, resizeTextures({ maxImageSize: 2048, targets: [{ format: 'webp' }], imageQuality: 90 }));
```

This standalone Node example converts a one-pixel PNG to WebP:

<!-- test:texture -->

```ts
import { transformImage } from 'mtlx-core/textures';

const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==',
  'base64',
);
const { data, extension } = await transformImage(pngBytes, '.png', { targets: [{ format: 'webp' }] });
if (extension !== '.webp' || data.byteLength === 0) throw new Error('Image conversion failed');
```

See [Processing pipelines](https://github.com/bhouston/mtlx/blob/main/packages/core/PROCESSING.md) for `processMaterialX`, staged results, and dry-run planning.

Node helpers require Node.js 22+. Installing `mtlx-core` also installs Sharp. See [read limits](https://github.com/bhouston/mtlx/blob/main/packages/core/READ_LIMITS.md) for input budgets.

[Generated API reference](/docs/api/core/)
