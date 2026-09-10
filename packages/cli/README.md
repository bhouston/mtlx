# mtlx-cli

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-mtlx.ben3d.ca-blue)](https://mtlx.ben3d.ca)

The `mtlx` command-line tool for validating, inspecting, converting, and transforming
[MaterialX](https://materialx.org) files (`.mtlx`, `.mtlz`, `.mtlx.zip`), built on
[`mtlx-core`](https://www.npmjs.com/package/mtlx-core).

```sh
npm install -g mtlx-cli
```

```sh
mtlx check material.mtlx
mtlx info material.mtlz --format json
mtlx pack material.mtlx --max-image-size 2048 --image-format webp
mtlx unpack material.mtlz
mtlx transform material.mtlx --image-format webp --image-quality 90
```

Every command supports `--format text|json|yaml` (default `text`). See the
[mtlx monorepo](https://github.com/bhouston/mtlx) for the underlying library, the
[mtlx.ben3d.ca](https://mtlx.ben3d.ca) viewer, and the VS Code extension.
