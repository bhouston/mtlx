# mtlx

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bhouston/mtlx/blob/main/LICENSE)
[![Live demo](https://img.shields.io/badge/viewer-mtlx.ben3d.ca-blue)](https://mtlx.ben3d.ca)

_A pure TypeScript/JavaScript [MaterialX](https://materialx.org) SDK and viewer — runs the same
on Node.js and in the browser, on Windows, macOS, and Linux._

mtlx parses, validates, packages, and transforms MaterialX materials: loose `.mtlx` documents and
relaxed `.mtlx.zip` archives. It is the library behind the
[mtlx.ben3d.ca](https://mtlx.ben3d.ca) viewer and the "Mtlx Viewer" VS Code extension. Because it's
pure TS/JS with zero native/binary dependencies, it installs and runs anywhere Node or a browser
does — no native builds, no platform-specific binaries — making MaterialX easier to reach for
everyday artists and developers.

## Packages

| Package                                                                                         | Description                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`mtlx-core`](https://github.com/bhouston/mtlx/tree/main/packages/core)                         | Parse, validate, package, and transform MaterialX. Pure and browser-safe; Node helpers under `mtlx-core/node`, texture processing under `mtlx-core/textures`. |
| [`mtlx-cli`](https://github.com/bhouston/mtlx/tree/main/packages/cli)                           | The `mtlx` command: `check`, `info`, and `transform`/`x` (convert, pack, unpack, combine, resize textures).                                                   |
| [`website`](https://github.com/bhouston/mtlx/tree/main/packages/website)                        | Drag-and-drop viewer and validator at [mtlx.ben3d.ca](https://mtlx.ben3d.ca), plus these docs.                                                                |
| [`mtlx-vscode-extension`](https://github.com/bhouston/mtlx/tree/main/packages/vscode-extension) | "Mtlx Viewer": preview, inspect, and convert MaterialX files inside VS Code.                                                                                  |

## Scripting

```sh
npm install mtlx-core
```

```ts
import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';

// Load a .mtlx (with its textures) or .mtlx.zip into memory.
const pkg = await loadMaterialXPackage('material.mtlx');

// Apply transforms in order.
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp' }));

// Write back out as either format.
await writeMaterialXPackage(pkg, 'material.mtlx.zip');
```

In the browser, the root entry works on bytes and text with no filesystem:

```ts
import { checkMaterialXZipArchive, parseMaterialX, validateDocument } from 'mtlx-core';

const issues = validateDocument(parseMaterialX(xmlText));
const archiveIssues = checkMaterialXZipArchive(new Uint8Array(await file.arrayBuffer()));
```

See the [mtlx-core README](https://www.npmjs.com/package/mtlx-core) for the full API.

## Command line

```sh
npm install --global mtlx-cli
```

```sh
mtlx check material.mtlx
mtlx info material.mtlx.zip --format json
mtlx x material.mtlx -o material.mtlx.zip                         # pack
mtlx x material.mtlx.zip -o out/material.mtlx                     # unpack
mtlx x material.mtlx -o material.mtlx.zip --max-image-size 2048 --image-format webp
mtlx x "{metal,wood,glass}.mtlx" -o combined.mtlx.zip             # combine
mtlx x "materials/*.mtlx" -o out/                                 # batch: one output file per input
```

See the [mtlx-cli README](https://www.npmjs.com/package/mtlx-cli) for the full reference.

## Contributing

See [CONTRIBUTING.md](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md) for setup,
testing, and release steps, and [CHANGELOG.md](https://github.com/bhouston/mtlx/blob/main/CHANGELOG.md)
for what has changed.

## Credits

Created by [Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).

The library design inspired by Don McCurdy's [glTF Transform](https://gltf-transform.dev).

## License

MIT
