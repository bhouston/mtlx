# mtlx-viewer

[![npm](https://img.shields.io/npm/v/mtlx-viewer.svg)](https://www.npmjs.com/package/mtlx-viewer)
[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/material-viewer/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Embed interactive MaterialX previews in any website with `<material-viewer>`. Works in plain HTML and any framework, with orbit controls, lighting, a settings panel, loading progress, and screenshot export. React is optional.

## Plain HTML

Load the self-contained bundle from jsDelivr, then add the element. No build step or separate CSS is required.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mtlx-viewer/dist/material-viewer.js"></script>
<material-viewer
  src="https://mtlx.ben3d.ca/materials/copper/copper.mtlx"
  alt="Copper material under neutral studio lighting"
  settings-panel="closed"
  style="display:block;width:100%;height:440px"
></material-viewer>
```

The URL follows the latest npm release; add `@<version>` after `mtlx-viewer` to pin a release. Give the element a height. Remote materials and textures must allow CORS; rendering requires a GPU-backed WebGPU or WebGL2 browser context.

## With a bundler

```sh
npm install mtlx-viewer three
```

```js
import 'mtlx-viewer/element';
```

Use the same HTML element as above. This import uses your installed Three.js instead of the CDN bundle.

## React

```sh
npm install mtlx-viewer three react react-dom
```

```tsx
import { MaterialViewer } from 'mtlx-viewer/react';

<MaterialViewer src="/materials/copper.mtlx.zip" alt="Brushed copper" style={{ height: 440 }} />;
```

See the [element guide and live demo](https://mtlx.ben3d.ca/docs/material-viewer/) for attributes, events, camera controls, and screenshots, or the [viewer integration guide](https://mtlx.ben3d.ca/docs/viewer/) for React and lower-level Three.js APIs. Preview support follows Three.js's MaterialX loader.

MIT · Created by [Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).
