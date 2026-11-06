# mtlx-cli

[![npm](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://mtlx.ben3d.ca/docs/cli/)
[![CI](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Inspect, validate, preview, and package MaterialX from your terminal. Includes the `mtlx` and `mtlx-ai` commands for local files and the MTLX.ai service.

```sh
npm install --global mtlx-cli
```

Requires Node.js 22+. Preview and rendering commands also need a GPU-backed browser.

## Inspect and preview

```sh
mtlx check material.mtlx
mtlx info material.mtlx.zip --format json
mtlx view material.mtlx.zip
```

## Package and render

```sh
mtlx transform material.mtlx -o material.mtlx.zip --profile web
mtlx render material.mtlx.zip -o preview.png --view sphere --ibl studio
```

## Use hosted materials

```sh
mtlx login
mtlx search copper
mtlx download alice/copper -o copper.mtlx.zip
```

Read the [CLI guide](https://mtlx.ben3d.ca/docs/cli/) for conversion workflows and options, or the [agent guide](https://mtlx.ben3d.ca/docs/agents/) for MCP integration. Run `mtlx --help` or `mtlx <command> --help` for terminal help.

MIT · Created by [Ben Houston](https://ben3d.ca), sponsored by [Land of Assets](https://landofassets.com).
