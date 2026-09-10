# mtlx-cli

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux. Installs the `mtlx` command for validating, inspecting, converting, and
transforming MaterialX files (`.mtlx`, `.mtlz`, `.mtlx.zip`).

- Documentation: [mtlx.ben3d.ca/docs](https://mtlx.ben3d.ca/docs/documents/Command_line.html)
- Source: [github.com/bhouston/mtlx](https://github.com/bhouston/mtlx)

```sh
npm install --global mtlx-cli
```

```sh
mtlx check material.mtlx
mtlx info material.mtlz --format json
mtlx transform material.mtlx material.mtlz                    # pack
mtlx transform material.mtlz out/material.mtlx                # unpack
mtlx transform material.mtlx material.mtlz --max-image-size 2048 --image-format webp
```

Every command supports `--format text|json|yaml`.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
