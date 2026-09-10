# mtlx

[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-mtlx.ben3d.ca-blue)](https://mtlx.ben3d.ca)

TypeScript tools for [MaterialX](https://materialx.org) file manipulation.

Try the viewer live at **[mtlx.ben3d.ca](https://mtlx.ben3d.ca)**.

- [`mtlx-core`](packages/core) — parse, validate, and serialize `.mtlx` documents; pack/unpack `.mtlz` and `.mtlx.zip` single-file containers; resize/reformat referenced textures.
- [`mtlx`](packages/cli) — the `mtlx` command: `check`, `info`, `pack`, `unpack`, and `transform` for `.mtlx`, `.mtlz`, and `.mtlx.zip` files.
- [`website`](packages/website) — a drag-and-drop MaterialX viewer built on TanStack Start and three.js.
- [`mtlx-vscode-extension`](packages/vscode-extension) ("Mtlx Viewer") — previews and converts `.mtlx`/`.mtlz`/`.mtlx.zip` files directly in VS Code.

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Release

```sh
pnpm make-release:core
pnpm make-release:cli
```
