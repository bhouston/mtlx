---
title: Node editor
---

The [online node editor](/editor) edits MaterialX graphs with a live material preview. Load a local file or a sample, inspect parameters, connect nodes, and download an editable result. It runs in the browser on this documentation site.

## Reusable React components

`mtlx-editor` contains graph and inspector components. It is currently a source workspace package in this repository, rather than a published npm package. Clone the repository and run `pnpm install --frozen-lockfile` followed by `pnpm build` to develop with it. Headless document manipulation belongs to `mtlx-core/session`, so applications can use the same editing operations without installing React or Three.js.

```tsx
import { useState } from 'react';
import { createEditorSession } from 'mtlx-core/session';
import { MaterialXNodeGraph, NodeParameterEditor, createDefaultDocument } from 'mtlx-editor';
import 'mtlx-editor/styles.css';

function Editor() {
  const [session] = useState(() => createEditorSession({ document: createDefaultDocument() }));
  return (
    <>
      <MaterialXNodeGraph session={session} mode="edit" />
      <NodeParameterEditor session={session} />
    </>
  );
}
```

The core session owns semantic changes, validation, history, and subscriptions. The editor owns graph layout, selection, viewport state, React Flow integration, and preview preparation. Hosts decide how to load, save, and render documents.

## Compose the interface

Pass the same session to `MaterialXNodeGraph`, `NodeParameterEditor`, and `GraphToolbar`. Wrap them in `.mtlx-graph-frame` to place the toolbar and inspector over the graph, or arrange them in your own layout. Mount `useCommandShortcuts(session)` once to enable undo, redo, cut, copy, paste, duplicate, and group commands.

Set `mode="view"` for read-only graph interaction. Use `scope` and `onScopeChange` to connect graph navigation to your application, or let the session manage it. `session.toXml()` returns the current document for saving. Headless editing uses the [core session API](core.md#headless-editing).

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
graph, **Ctrl/Cmd+C**, **X** and **V** copy, cut and paste it through the system
clipboard as typed JSON (so nodes travel between browser tabs or a text file), **F**
frames the selection, **Escape** deselects, **Delete** removes nodes or wires.
Shift-drag or Shift-click selects several nodes; the inspector edits a single selected
node and the context menu's Copy, Cut and Delete act on the whole selection. The website
adds **Ctrl/Cmd+Z** and **Shift+Ctrl/Cmd+Z** for the session's undo and redo.

## Types and validation

Node types are inferred from connections and authored values. The **Edit as** selector chooses controls for entering a value; editing a value adds its type as a constraint. Invalid new connections are rejected. Imported conflicts appear in the graph's error log.

`NodeParameterEditor` follows the session's selection. It provides numeric, boolean, enum, color, vector, matrix, and text inputs. Connected inputs offer disconnect and reset actions. Graph errors highlight affected nodes and wires and clear when corrected. These checks cover selected graph rules; rendering can still fail for unsupported MaterialX nodes.

## Load, save, and share

Your host supplies file I/O and preview rendering. Preserve resource bytes when saving a `.mtlx.zip`; loose XML alone cannot carry local textures. Use `materializeDocument()` or `exportMaterial()` to resolve inferred types for export.

The online editor accepts `.mtlx` and `.mtlx.zip` files and `?materialUrl=<url>`. Its Share action copies a source link for unchanged remote materials, or a snapshot for small edited materials. Download a ZIP for larger materials or for portable delivery with textures.

[Generated API reference](/docs/api/editor/)
