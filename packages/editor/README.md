# mtlx-editor

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/editor/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Reusable React components for MaterialX node graphs and parameter editing. The headless `mtlx-core/session` API owns document changes and undo/redo; your application chooses how to load, save, and preview materials.

This is a source workspace package, not a published npm package. Build it from this repository with `pnpm install --frozen-lockfile` and `pnpm build`.

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

[Try the online editor](https://mtlx.ben3d.ca/editor/) or read the [integration guide](https://mtlx.ben3d.ca/docs/editor/) for styling, keyboard shortcuts, architecture, and [API reference](https://mtlx.ben3d.ca/docs/api/editor/).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
