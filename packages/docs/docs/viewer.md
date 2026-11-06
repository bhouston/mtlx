---
title: Viewer and React
---

`mtlx-viewer` provides the shared Three.js material scene, HDR lighting, rendering controls, custom element, and React components used by the website, CLI, and VS Code extension.

```sh
npm install mtlx-viewer three
```

## HTML custom element

```html
<script type="module" src="/material-viewer.js"></script>
<material-viewer
  src="/materials/copper/copper.mtlx"
  alt="Polished copper material"
  settings-panel="closed"
  style="display:block;width:100%;height:500px"
></material-viewer>
```

See [embedding and options](material-viewer.mdx) for the full API and a working example.

## React

```tsx
import { MaterialViewer } from 'mtlx-viewer/react';

<MaterialViewer
  src="/materials/copper/copper.mtlx"
  alt="Polished copper material"
  settings-panel="closed"
  style={{ height: 500 }}
/>;
```

The React wrapper registers the custom element in the browser and can be imported during server rendering. Low-level `createViewer` hosts supply document bytes, geometry bytes, resource I/O, and settings. Dispose the viewer when its owner unmounts.

## Lighting and inspection

Neutral studio lighting is generated in HDR on the GPU and cached per viewer. The white backdrop is independent of lighting; `background="environment"` displays the environment, and `background="none"` preserves transparency. `environment-rotation` rotates the lighting in degrees without fetching or regenerating the environment.

Camera orbit, target, and field of view can be declared and captured in share links. Custom descriptions name the focusable preview while interaction instructions remain available separately.

[Generated API reference](/docs/api/viewer/) · [Viewer source and complete API](https://github.com/bhouston/mtlx/tree/main/packages/viewer)
