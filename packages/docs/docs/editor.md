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

## Sharing

Editor links can contain an editable snapshot. Resource limitations apply: local external textures cannot automatically become public merely because a graph is shared. For portable delivery, package the material and resources as `.mtlx.zip` and host it at a URL.

[Generated API reference](/docs/api/editor/) · [Editor source and architecture](https://github.com/bhouston/mtlx/tree/main/packages/editor)
