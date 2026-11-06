<p align="center">
  <a href="https://mtlx.ben3d.ca" target="_blank" rel="noopener noreferrer">
    <img alt="mtlx logo" src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/mtlx-core"><img src="https://img.shields.io/npm/v/mtlx-core.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/mtlx-core"><img src="https://img.shields.io/npm/dw/mtlx-core.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/mtlx"><img src="https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/wzQWaBBxup"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://mtlx.ben3d.ca/docs/core/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# mtlx-core

> Parse, validate, package, and transform MaterialX in TypeScript.

- 🌐 Browser and Node Support
- ✅ Document Validation Reports
- 📦 `.mtlx.zip` Packaging
- 🖼️ Texture Resizing and Conversion
- 🕸️ Headless Graph Editing

The root API works with bytes and text in browsers and Node. Filesystem and texture-processing helpers use separate Node-only imports.

[Read the Docs to Learn More](https://mtlx.ben3d.ca/docs/core/).

```sh
npm install mtlx-core
```

## Inspect a document

```ts
import { inspectMaterialX } from 'mtlx-core';

const bytes = new TextEncoder().encode('<materialx version="1.39"/>');
const report = await inspectMaterialX(bytes, 'material.mtlx');
console.log(report.issues);
```

## Prepare a material for the web

```ts
import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';

const pkg = await loadMaterialXPackage('material.mtlx');
await transform(pkg, resizeTextures({ maxImageSize: 2048, targets: [{ format: 'webp' }] }));
await writeMaterialXPackage(pkg, 'material.mtlx.zip');
```

Node.js 22+ is required for Node helpers. Installing the package includes native Sharp texture processing. Validation covers selected MaterialX rules; it does not guarantee renderer support.

See the [core guide](https://mtlx.ben3d.ca/docs/core/) for the document model, headless graph editing, transforms, and [API reference](https://mtlx.ben3d.ca/docs/api/core/).

## Contribution

See [Contributing Guide](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
