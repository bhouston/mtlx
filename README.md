# mtlx

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![npm version](https://img.shields.io/npm/v/mtlx-core.svg)](https://www.npmjs.com/package/mtlx-core)
[![Coverage](https://codecov.io/gh/bhouston/mtlx/branch/main/graph/badge.svg)](https://codecov.io/gh/bhouston/mtlx)
[![Discord](https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white)](https://discord.gg/wzQWaBBxup)

TypeScript and JavaScript tools for viewing, editing, validating, and delivering [MaterialX](https://materialx.org) materials. Work with loose `.mtlx` files or portable `.mtlx.zip` archives in the browser, terminal, or VS Code.

[Try the viewer](https://mtlx.ben3d.ca/viewer/) · [Open the editor](https://mtlx.ben3d.ca/editor/) · [Get started](https://mtlx.ben3d.ca/docs/quick-start/)

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/viewer-inspection.png" alt="MaterialX preview and inspection controls" width="720">

## Embed a material

Add `<material-viewer>` to any HTML page. No React or build step is required.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mtlx-viewer/dist/material-viewer.js"></script>
<material-viewer
  src="https://mtlx.ben3d.ca/materials/copper/copper.mtlx"
  alt="Copper material under neutral studio lighting"
  settings-panel="closed"
  style="display:block;width:100%;height:440px"
></material-viewer>
```

[Element guide and live demo](https://mtlx.ben3d.ca/docs/material-viewer/)

## Use the CLI

```sh
npm install --global mtlx-cli
mtlx check material.mtlx
mtlx view material.mtlx
mtlx transform material.mtlx -o material.mtlx.zip --profile web
```

## Choose a library

| Package                                                                                                     | Use it for                                                             | Documentation                                         |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [mtlx-core](https://www.npmjs.com/package/mtlx-core)                                                        | Parsing, validation, packaging, transforms, and headless graph editing | [Core guide](https://mtlx.ben3d.ca/docs/core/)        |
| [mtlx-viewer](https://www.npmjs.com/package/mtlx-viewer)                                                    | Web component, React wrapper, and Three.js preview APIs                | [Viewer guide](https://mtlx.ben3d.ca/docs/viewer/)    |
| [mtlx-cli](https://www.npmjs.com/package/mtlx-cli)                                                          | Local workflows and MTLX.ai commands                                   | [CLI guide](https://mtlx.ben3d.ca/docs/cli/)          |
| [mtlx-sdk](https://www.npmjs.com/package/mtlx-sdk)                                                          | Typed MTLX.ai service client                                           | [SDK guide](https://mtlx.ben3d.ca/docs/sdk/)          |
| [mtlx-editor](packages/editor)                                                                              | Reusable React node editor (source workspace package)                  | [Editor guide](https://mtlx.ben3d.ca/docs/editor/)    |
| [VS Code extension](https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension) | Previews, node graphs, and packaging inside your editor                | [Extension guide](https://mtlx.ben3d.ca/docs/vscode/) |

Node tools require Node.js 22+. Browser rendering needs GPU-backed WebGPU or WebGL2. Validation covers selected document rules; preview support follows Three.js's MaterialX loader.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup and the issue → branch → PR workflow. Full guides and API references live on the [documentation website](https://mtlx.ben3d.ca/docs/); release instructions are in [RELEASING.md](RELEASING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
