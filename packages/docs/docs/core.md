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

## Documents and packages

A document preserves MaterialX XML structure. A `MaterialXPackage` holds a document together with its resource bytes, regardless of whether the original source was a loose XML file or a zip package. Parsing malformed XML throws; validation reports supported semantic checks separately.

## Headless editing

`mtlx-core/session` owns graph operations, validation, subscriptions, transactions, and undo/redo. It has no React, DOM, or renderer dependency. Semantic transactions are synchronous: load remote resources before starting a transaction. The session publishes immutable snapshots; use `cloneMaterialXDocument` if you need a separately mutable copy.

[Generated API reference](/docs/api/core/) · [Full core guide and source](https://github.com/bhouston/mtlx/tree/main/packages/core)
