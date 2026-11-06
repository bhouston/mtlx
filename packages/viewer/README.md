<p align="center">
  <a href="https://mtlx.ben3d.ca" target="_blank" rel="noopener noreferrer">
    <img alt="mtlx logo" src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/mtlx-viewer"><img src="https://img.shields.io/npm/v/mtlx-viewer.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/mtlx-viewer"><img src="https://img.shields.io/npm/dw/mtlx-viewer.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/mtlx"><img src="https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/wzQWaBBxup"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://mtlx.ben3d.ca/docs/material-viewer/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# mtlx-viewer

> Embed interactive MaterialX previews in any website.

- 🧩 `<material-viewer>` Web Component
- ⚛️ Optional React Wrapper
- 🎥 Orbit Controls and Lighting
- 🎛️ Built-In Settings Panel
- 📸 Screenshot Export

Works in plain HTML and any framework. Load one script from a CDN or import it from npm, then add the element.

[Read the Docs to Learn More](https://mtlx.ben3d.ca/docs/material-viewer/).

## Plain HTML

Load the self-contained bundle from jsDelivr, then add the element. No build step or separate CSS is required.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mtlx-viewer/dist/material-viewer.js"></script>
<material-viewer src="https://mtlx.ben3d.ca/materials/copper/copper.mtlx"></material-viewer>
```

The URL follows the latest npm release; add `@<version>` after `mtlx-viewer` to pin a release. The element defaults to 440px tall; override its size with CSS. Remote materials and textures must allow CORS; rendering requires a GPU-backed WebGPU or WebGL2 browser context.

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

## Contribution

See [Contributing Guide](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
