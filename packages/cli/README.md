# mtlx-cli

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux. Installs the `mtlx` command for validating, inspecting, converting, and
transforming MaterialX files (`.mtlx`, `.mtlx.zip`).

```sh
npm install --global mtlx-cli
```

Every command accepts `--format text|json|yaml` (default `text`), so output can be piped into
other tools. `transform` reads any format and writes any format, so packing and unpacking are just
a conversion with no options.

```sh
# validate a file; exits non-zero on any error-level issue, so it works as a CI gate
mtlx check material.mtlx

# print material/texture/document info
mtlx info material.mtlx.zip --format json

# pack a .mtlx (plus its textures) into a single .mtlx.zip
mtlx transform material.mtlx material.mtlx.zip

# unpack a .mtlx.zip back into a .mtlx with textures alongside it
mtlx transform material.mtlx.zip out/material.mtlx

# convert while packing: resize textures and switch their format
mtlx transform material.mtlx material.mtlx.zip --max-image-size 2048 --image-format webp

# open a 3D preview in your browser (local only, nothing is uploaded)
mtlx view material.mtlx
```

Run `mtlx <command> --help` for the full option list of any command.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
