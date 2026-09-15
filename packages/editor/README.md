# mtlx-editor

A functional MaterialX graph editor, with no dependency on Three.js or the website.

```tsx
import { useState } from 'react';
import { createEditorSession } from 'mtlx-core/session';
import { MaterialXNodeGraph, MaterialXNodeLib, createDefaultDocument, useEditorSession } from 'mtlx-editor';
import 'mtlx-editor/styles.css';

function Editor() {
  const [editor] = useState(() => createEditorSession({ document: createDefaultDocument() }));
  const snapshot = useEditorSession(editor);
  return (
    <>
      <button disabled={!snapshot.canUndo} onClick={editor.undo}>
        Undo
      </button>
      <button disabled={!snapshot.canRedo} onClick={editor.redo}>
        Redo
      </button>
      <MaterialXNodeLib onAdd={(spec) => editor.graph().addNode({ definition: spec.nodeDefName })} />
      <MaterialXNodeGraph session={editor} mode="edit" />
    </>
  );
}
```

## Headless editing lives in core

Import `createEditorSession` from `mtlx-core/session`. It owns immutable document
snapshots, graph operations and queries, validation, transactions, subscriptions, and
undo/redo. It works without installing this React package. See the
[core session API and scripting examples](../core/README.md#mtlx-coresession-browser-safe-editing).

`mtlx-editor` re-exports the same session implementation for convenience. Low-level
mutation exports in `mtlx-editor/model` also delegate to core. Snapshots carry a `dirty`
flag and `session.toXml()` serializes the current document, so hosts need not diff XML.

`useEditorSession(editor)` remains in this package. It subscribes React through
`useSyncExternalStore`. The graph viewer adds canvas positions to core's semantic graph;
selection, viewport, menu labels, and renderer-specific preview preparation remain here.
Core session node queries no longer expose a computed `position`; use `projectGraph()`
for display positions or the node's XML attributes for persisted `xpos`/`ypos`.

## Boundaries

- **Core** owns the loss-preserving MaterialX document tree, parsing, serialization,
  archive resources, and standard node definitions. The registry includes output types,
  groups, literal defaults, enums, ranges, and implicit geometry metadata. It is generated
  from `submodules/MaterialX` by `pnpm generate:nodes`; the generated header records the
  upstream version and source fingerprint.
  No renderer-specific definitions belong in core.
- **Core session** (`mtlx-core/session`) owns immutable editing operations, semantic
  graph queries, node-family membership, type resolution, validation, and history.
  Operations preserve unrelated XML, comments, custom nodes, and resource paths. The
  catalog incorporates document-local definitions, including inherited ports.
- **Editor model** (`mtlx-editor/model`) adapts the semantic graph to canvas nodes and
  edges, supplies default positions, and prepares renderer-specific preview XML.
  Its mutation exports are compatibility re-exports from core. It has no React imports.
- **React components** subscribe to a shared `session` and project its document into
  React Flow nodes and edges. `MaterialXNodeGraph` takes only a `session`; a host that
  starts from a document creates one with `useState(() => createEditorSession(...))`.
  `MaterialXGraphView` does this internally for read-only file inspection.
  `mode="view"` disables UI edits (headless callers can still edit their session). `scope` selects the
  document (`''`) or a named nodegraph. Compound nodes expose **Expand**, with breadcrumbs
  above the canvas to return to parent graphs. `onScopeChange` synchronizes navigation
  with a host scope selector or node library; without it, navigation is managed internally.
  Expansion works in view mode and for local node definition implementations. Nested
  graph scopes use slash-separated paths. `MaterialXNodeList` is shared between category
  browsing and search results. The drag payload contains only a nodedef identifier.
- **Website** owns file I/O, archive resources, scope selection, and preview scheduling.
  Its toolbar and graph share the session's history. Each semantic edit produces new XML (or a ZIP containing XML and original
  resources) after a 400 ms debounce. It reuses the existing `mtlx-viewer` integration,
  which compiles through Three.js `MaterialXLoader`. Moving nodes saves `xpos`/`ypos`
  without recompiling the preview. A replaced preview is cancelled and disposed.

## Styling and theming

Import `mtlx-editor/styles.css` once. Every color is a `--mtlx-*` custom property set on
`.mtlx-editor`, `.mtlx-context-menu` and `.mtlx-quick-add`, and each defaults to the
shadcn-style host variable (`--background`, `--foreground`, `--border`, `--muted`,
`--muted-foreground`, `--accent`, `--accent-foreground`, `--primary`, `--popover`,
`--popover-foreground`, `--destructive`). Hosts using those variables, including
`next-themes` dark mode, are themed automatically; others override the tokens directly:

```css
.mtlx-editor {
  --mtlx-bg: #1c1f24;
  --mtlx-fg: #e6e8ec;
  --mtlx-border: #3a3f47;
  --mtlx-canvas: #15171b;
  --mtlx-primary: #7aa2ff;
}
```

Tokens: `--mtlx-bg`, `--mtlx-fg`, `--mtlx-border`, `--mtlx-canvas`, `--mtlx-muted-fg`,
`--mtlx-accent`, `--mtlx-accent-fg`, `--mtlx-primary`, `--mtlx-popover`,
`--mtlx-popover-fg`, `--mtlx-error`, `--mtlx-shadow`. Socket and node header colors
are fixed per type and node group. Pass `colorMode` so React Flow's own controls and
background follow the host theme.

`MaterialXNodeGraph` and `MaterialXNodeLib` accept `className`; the graph is 650px tall
by default and `.mtlx-fill` stretches it to a flex parent. The graph creates its own
`ReactFlowProvider`, so React Flow hooks only work inside its custom nodes; a host that
needs them must render its own provider around a different React Flow instance.

## Keyboard shortcuts

With the pointer over the canvas: **Shift+A** or double-click opens quick-add at the
cursor; releasing a dragged wire on empty canvas opens it filtered to compatible
nodes. **Ctrl/Cmd+D** duplicates the selection, **Ctrl/Cmd+G** groups it into a node
graph, **F** frames the selection, **Escape** deselects, **Delete** removes nodes or
wires. Shift-drag or Shift-click selects several nodes; the inspector edits the last
one and the context menu's Clone and Delete act on the whole selection. The website
adds **Ctrl/Cmd+Z** and **Shift+Ctrl/Cmd+Z** for the session's undo and redo.

## Prototype workflows

Open or drop `.mtlx` / `.mtlx.zip`, browse/search and drag/click nodes, select a node to
edit values, wire compatible ports, or use the inspector's connection menus.
Click a wire to select it, then double-click, press Delete, or right-click it to disconnect.
Right-click a port for Disconnect and Reset to default; the inspector offers the same.
Delete removes references to the removed nodes. The website has undo/redo (50 changes),
graph scope navigation, and `.mtlx.zip` download. Downloads always include the
current document and all loaded resource bytes.

## Automatic node types

The library and context menu offer one entry per node family. Definitions with the same
category, version, target, and port names form a family; different interfaces remain
separate entries. Search matches every variant's name and type but returns the family once.

All eligible nodes, including imported nodes, infer their types from connections and
explicitly authored input values. Stored `type` and `nodedef` attributes identify the
family, but do not pin its type. The graph shows `tiledimage` while its output type is
ambiguous, and `tiledimage (vector3)` with a light-grey suffix once it is known. Shared
inputs such as texture coordinates do not determine the image's output type.

Inference propagates in both directions through connected nodes. Disconnect, reset,
delete, replacement connections, and undo recompute from the remaining constraints.
An authored typed value remains a constraint even if it equals a definition's default.
New nodes author no defaults; resetting an input removes its authored value. The
**Edit as** dropdown temporarily selects the inspector's controls and defaults.
Changing it does not change the graph, preview, export, or undo history. Editing a value
authors the input type used by those controls; that value can then constrain the node.
Only compatible variants are offered, with input-type differences shown for overloads
sharing an output type. Selecting another node discards the temporary view choice.

`resolveTypes()` returns candidate definitions, inferred socket types, and a concrete
fallback for each node. It filters candidates with a work queue and uses deterministic
backtracking to select the first jointly compatible definitions in document/catalog
order. Connected components are solved independently and results are cached for immutable
document/catalog pairs. Contradictory new connections are rejected without changing the
document; imported conflicts remain visible in the error log.

`materializeDocument()` and `exportMaterial()` resolve a copy to concrete MaterialX,
leaving defaults implicit. `previewXml()` uses the same choices and supplies missing
literal defaults in its temporary renderer copy, since Three.js does not consistently
look them up from nodedefs. Neither operation changes the author's document or turns a
fallback choice into a type constraint. Exported files become automatic again on import,
so no editor-specific persistence format or Auto/fixed toggle is required.

The `/editor` toolbar shares the viewer's file picker, URL dialog, and sample list. It accepts
`?materialUrl=https://example.com/material.mtlx.zip` and the legacy `?material=standard_surface/copper`
query. The website editor is always editable. Preview settings and `scope` also round-trip in the URL without reloading the
material. URL imports collect relative textures and included libraries, resolve redirects,
and rewrite references into portable ZIP paths.

Share copies an editor link. Unchanged URL-loaded materials use a short source link; edited
or local materials use a ZIP snapshot in the URL fragment, preserving edits, node positions,
and bundled resources without an upload. Snapshots are limited to 24 KiB compressed, 1 MiB
expanded, and 128 entries. Larger edited materials can be shared using the ZIP download.

## Current limits

- The node library represents MaterialX definitions, not a promise of Three.js support.
  Unsupported nodes and missing resources are reported by the existing preview.
- Nodes without `xpos`/`ypos` get a layered data-flow layout; **Arrange** applies it on
  demand. Node bodies list only connected or authored inputs until expanded.
- Parameter values serialize as MaterialX text (e.g. `0.2, 0.5, 0.8`). Session validation
  does not enforce all range metadata or extension-specific value formats.
- Nodes can be renamed from the inspector and grouped into node graphs; editing
  definitions and adding definitions from included libraries to the node palette are
  future work.
  Unrecognized document elements are preserved rather than reconstructed.
- Loose `.mtlx` cannot include local texture bytes. Open a ZIP to preview and preserve
  bundled textures; resource import/replacement is not yet exposed in the UI.

## Verification

From the repository root:

```sh
pnpm test
pnpm --filter website build
pnpm --filter website test:e2e
# For concurrent browser runs, choose a separate port:
MTLX_E2E_PORT=3137 pnpm --filter website test:e2e
```

Core session tests cover deep immutability, sequential scripts, transaction rollback, nested
savepoints, notifications, history, scoped queries, shared validation, and broken imports.
Editor model tests cover defaults, immutable edits, connections/cycles, scopes,
unknown XML, archive resource preservation, and round trips. Vitest-driven Playwright
workflows cover the website, including actual Three.js rendering and recompile.

## Live graph validation

The visible graph scope is checked whenever the document changes, in both edit and view
modes. Checks cover unresolved connections and explicit definitions, port and connection
types, cycles, duplicate node names, and numeric/boolean parameter values. Problem nodes
and wires have thick red outlines; sockets and wire centers retain their type colors.
A scrollable log overlays the canvas while errors exist, with selectable text including
node and input names for copying. Correcting errors automatically clears the highlights
and log. Missing sources highlight the receiving node because no wire can be drawn.
These are editor checks, not full MaterialX conformance or renderer compilation checks.

### Parameter editors

`NodeParameterEditor` renders the selected node's inputs (output nodes have no parameter panel).
`ParameterEditor` is a React component type with `parameter`, `value`, `onChange`, `disabled`,
and `ariaLabel` props. Implementations render their own layout using the shared `ParameterLabel`.
`getParameterEditor` selects float/integer sliders, boolean toggles, enums, color pickers,
vector2/3/4 components, matrix33/44 grids, or text/path fields. Unsupported types are read-only.
Numeric fields reject invalid drafts and respect `uimin`/`uimax`; blur or Escape restores the
last valid value. Sliders default to 0–1 and expand to include values outside that range when
no range metadata is provided. Color pickers use `react-colorful` with normalized RGB(A)
channels; numeric fields retain HDR values. Click the swatch beside a color label to expand
the picker, numeric channels and RGB hex field. Hex edits accept 3 or 6 digits and commit on
Enter or blur, preserving alpha. No color-space conversion is applied. Labels omit type names.
Connected inputs use `ConnectedParameterEditor`, with a source indicator and disconnect action.
Reset uses a refresh icon with an accessible label. Create connections by dragging graph ports.

The **Sample materials** picker includes deliberately invalid examples:

| Sample                  | Error                                     | Suggested fix                                                       |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `error_invalid_values`  | Incomplete color and nonnumeric roughness | Set `surface.base_color` to `0.8, 0.2, 0.1` and roughness to `0.3`. |
| `error_connection_type` | Color output connected to float roughness | Disconnect `surface.specular_roughness`.                            |
| `error_missing_source`  | Reference to a missing color node         | Reset `surface.base_color`.                                         |
| `error_cycle`           | Two add nodes feed each other             | Disconnect either `in1` wire.                                       |
| `error_missing_output`  | Reference to a nonexistent graph output   | Connect `surface.base_color` to `palette.color`.                    |

The `error_subgraph` sample has a color-to-float connection error two graphs deep.
The **finish** container shows an error immediately. Expand **finish**, then **roughness**,
to see the invalid wire from **color** to **amount.in1**. Disconnect that wire to clear
both container indicators. This invalid graph is separate from the surface preview.

All errors are visible in the document scope, including propagated container indicators. The cycle example keeps its loop separate
from the surface so the material can still preview. Other examples may also produce
preview compilation errors until repaired.

Inputs with `defaultgeomprop` and no literal value use `GeometryParameterEditor`: a compact
source indicator with an “Override with constant…” menu. Normal overrides start at `0, 0, 1`,
tangents at `1, 0, 0`; these are editable starting constants, not sampled geometry values.
Reset removes the override and restores the geometry source. Connected inputs continue to
use `ConnectedParameterEditor`; read-only geometry rows have no override menu.
