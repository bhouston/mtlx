# mtlx-core

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/wzQWaBBxup)

Part of the [Mtlx suite of web-focused MaterialX tools](https://mtlx.ben3d.ca). The root TypeScript/JavaScript
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

## `mtlx-core/session` (browser-safe editing)

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

- `graph.addNode({ definition })` and `graph.cloneNode(id)` return the generated node
  name immediately. Names are unique within a scope. They do not author positions.
- `graph.removeNodes(ids)` removes the nodes and cleans their connections. Unknown
  nodes, scopes, ports, and definitions throw `EditorError` with a code and message.
- `graph.setInputValue(id, input, value, { type? })` accepts MaterialX text, finite
  numbers, booleans, or arrays of finite numbers. An explicit type selects an authored
  input type when a node family is ambiguous (for example, color3 versus vector3).
  Numeric tuple sizes, numeric syntax, booleans, and type compatibility are validated.
  Not every MaterialX extension type or metadata constraint has a validator.
- Setting a value replaces its connection. Connecting replaces a value or previous
  connection. `disconnectInput(id, input)` removes a connection and restores the
  definition default; it does nothing to an unconnected value. `resetInput(id, input)`
  removes both an authored value and any connection.
- `checkConnection(source, target)` returns a diagnostic or `undefined`, without
  changing state. It shares the checks used by `connect`, which validates again.
- Queries include `listScopes()`, `getDiagnostics()`, and graph methods `listNodes()`,
  `getNode(id)`, `getInputs(id)`, `getOutputs(id)`, and `getConnection({ node, input })`.
  Connection queries preserve unresolved source references so broken imports can be
  inspected. Node names are scoped references, not permanent IDs across document loads
  or deletion and recreation.

Each successful edit creates a new, deeply frozen document snapshot. Earlier snapshots
stay unchanged. The session clones imported documents and supplied catalogs, so callers
retain ownership of their inputs. Queries expose deeply read-only types and frozen
results. Use `cloneMaterialXDocument(editor.getDocument())` when a separate mutable
copy is needed by a low-level core API. The canonical core document API itself remains
mutable; immutability is enforced at the session boundary.

`editor.subscribe(listener)` returns an unsubscribe function. `getSnapshot()` returns a
stable `{ document, canUndo, canRedo, undoLabel, redoLabel }` object until a commit;
React consumers can use `useEditorSession(editor)` from the separate `mtlx-editor`
package. A graph handle always reads the session's latest state, including edits earlier in the same
script. Views derive their nodes and wires from that document.

Transactions are **synchronous**: perform asynchronous loading before starting one.
A successful transaction publishes once and creates one undo entry. An uncaught error
rolls it back without notifying subscribers or discarding redo history. Nested
transactions act as savepoints; catching a nested failure lets the outer transaction
continue. Operations validate before updating their working snapshot, so transactions
do not allow temporarily invalid edits. `getDocument()` and queries inside a transaction
see the working snapshot; `getSnapshot()` stays at the last committed snapshot.
No-op edits and transactions with no net changes create no history entry.

History defaults to 50 entries; configure `historyLimit` (zero disables retained undo
history). `replaceDocument(document)` loads even an invalid document and clears history.
Snapshots carry `dirty`, true once the document differs from the one last loaded or
passed to `markClean()`; `toXml()` serializes the current document. `graph(scope)`
returns the same handle for a scope on every call.
New edits reject newly introduced diagnostics while existing imported errors can remain
during repair. History travel and document replacement are unavailable inside a
transaction.

Layout stays separate: `editor.layout.moveNodes({ [id]: { x, y } }, scope)` writes
`xpos`/`ypos` without semantic validation. The UI wraps creation and placement in one
transaction, so Undo removes the newly placed node in one step. Selection, viewport,
parameter control selection, and graph navigation remain view state.

The session and its semantic operations, node-family membership, and type resolution have
no dependency on `mtlx-editor`, React, React Flow, a DOM, or a renderer. Installing the
editor is unnecessary for scripts, CLI tools, or workers.

`readGraph(document, scope, catalog)` provides a semantic graph snapshot for low-level
consumers. Its nodes and the session's node queries have no computed `position` or
selection state. Authored `xpos`/`ypos` remain available in XML attributes; assigning
fallback canvas positions belongs to `projectGraph()` in `mtlx-editor/model`. Persisting
layout metadata through `session.layout.moveNodes()` can still share a transaction and
undo entry with a semantic edit. The core does not calculate layout.

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

Filesystem loading, dependency resolution, and staged output commits. Reads support parent-relative
resources and inherited `fileprefix`; recursive includes are packaged with their own resources.
Multi-input merges and writes preserve their input packages. File transforms mutate their input.

`checkMaterialX` and `checkMaterialXZipArchive` default to basic, structure, and resource checks.
`validateDocument` and CLI `check` default to basic checks; select rule groups explicitly for CI.

Validation visits every nodegraph recursively, including unopened and unconnected graphs.
The Info panel and node graph viewer share the core rules: `structure` checks references,
outputs and connection cycles; `types` checks declared inputs, connections and numeric/boolean
values. Definition resolution uses input types to distinguish overloads and honors explicit
`nodedef` references. `getNodeCatalog` and `findNodeSpec` expose the same resolution for UI ports.
Graph findings include optional `graph` coordinates (`scope`, `nodeIds`, `input`, `source`,
`output`) so clients can highlight nodes and wires without parsing diagnostic messages.
The optional `graph.containers` lists enclosing graphs and compound instances transitively,
allowing collapsed nodes to show errors from their contents. Each diagnostic remains listed
once at its original location, including when multiple instances share an implementation.
Locations and rule codes remain available to CLI and other consumers.

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
await transform(pkg, resizeTextures({ maxImageSize: 2048, targets: [{ format: 'webp' }] }));
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

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).

## Node definitions for editors

`materialXNodeRegistry` includes typed port definitions, literal default values, node groups,
and original UI metadata (`uiname`, `enum`, ranges, and `defaultgeomprop`). Entries with a
`nodeDefName` describe concrete library variants; structural fallback entries remain available
for validation. Definitions are generated from the local `submodules/MaterialX` source tree,
with nodedef inheritance resolved. Run `pnpm generate:nodes` from the repository root to update
them, or `pnpm check:nodes` to verify that the committed output matches the local source. An
alternate source directory can be passed to either command. The generated header records the
upstream version and a SHA-256 fingerprint of the input files. Generation also copies
[the MaterialX license](MATERIALX-LICENSE) from that source tree. See
[the contributor guide](../../CONTRIBUTING.md#updating-materialx-node-definitions) for the workflow.
