# mtlx-core

[![npm](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/core/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Parse, validate, package, and transform MaterialX in TypeScript or JavaScript. The root API works with bytes and text in browsers and Node; filesystem and texture-processing helpers use separate Node-only imports.

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

MIT · Created by [Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).
