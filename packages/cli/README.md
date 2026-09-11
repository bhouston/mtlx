# mtlx-cli

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite: a pure TypeScript/JavaScript
MaterialX toolkit with no binary dependencies, working out of the box on Node, browsers, Windows,
macOS, and Linux. Installs the `mtlx` command for validating, inspecting, converting, and
transforming MaterialX files (`.mtlx`, `.mtlx.zip`).

- Library: [mtlx-core on npm](https://www.npmjs.com/package/mtlx-core)
- Source: [github.com/bhouston/mtlx](https://github.com/bhouston/mtlx)

```sh
npm install --global mtlx-cli
```

<details>
  <summary><i>Troubleshooting</i></summary>

mtlx uses [sharp](https://sharp.pixelplumbing.com/) to resize and reformat textures. If
installation fails on sharp, consult the [sharp installation](https://sharp.pixelplumbing.com/install)
page for your platform.

</details>

`transform` reads any format and writes any format, so packing and unpacking are just a conversion
with no options. Every command accepts `--format text|json|yaml` (default `text`), so output can
be piped into other tools:

```sh
mtlx check material.mtlx
mtlx info material.mtlx.zip --format json
mtlx transform material.mtlx material.mtlx.zip                    # pack
mtlx transform material.mtlx.zip out/material.mtlx                # unpack
mtlx transform material.mtlx material.mtlx.zip --max-image-size 2048 --image-format webp
```

`check` exits non-zero when any error-level issue is found, so it works as a CI gate.

## Viewing a file

```sh
mtlx view material.mtlx
```

Starts a local HTTP server (127.0.0.1, random free port), opens your default browser to a 3D
preview rendered with the same three.js viewer as the [website](https://mtlx.ben3d.ca) and VS Code
extension, and prints the URL in case the browser doesn't open automatically (e.g. over SSH or in
CI). Nothing is uploaded anywhere — the server only serves files from your machine to your own
browser, and shuts down on Ctrl+C (or automatically after 30 minutes idle).

## Reference

The following is generated from `mtlx --help` by `pnpm docs:cli`; do not edit it by hand.

<!-- begin:cli_help -->

```text
mtlx <command>

Commands:
  mtlx check <input>               Validate a .mtlx or .mtlx.zip file
  mtlx info <input>                Print information about a .mtlx or .mtlx.zip file
  mtlx transform <input> <output>  Convert between .mtlx and .mtlx.zip (pack/unpack), optionally
                                   resizing or reformatting textures
  mtlx view <input>                Open a local 3D preview of a .mtlx or .mtlx.zip file in your
                                   browser

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]

Documentation: https://www.npmjs.com/package/mtlx-cli
```

```text
mtlx check <input>

Validate a .mtlx or .mtlx.zip file

Positionals:
  input  Path to .mtlx or .mtlx.zip file                                         [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --format   Output format                       [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx info <input>

Print information about a .mtlx or .mtlx.zip file

Positionals:
  input  Path to .mtlx or .mtlx.zip file                                         [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --format   Output format                       [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx transform <input> <output>

Convert between .mtlx and .mtlx.zip (pack/unpack), optionally resizing or reformatting textures

Positionals:
  input   Path to .mtlx or .mtlx.zip file                                        [string] [required]
  output  Output path; the extension picks the format (a .mtlx path unpacks resources beside it)
                                                                                 [string] [required]

Texture options:
  --max-image-size  Resize any texture whose longest edge exceeds this many pixels          [number]
  --image-format    Convert textures to this image format    [choices: "webp", "png", "jpg", "avif"]
  --image-quality   Quality for lossy image formats (webp/jpg/avif)           [number] [default: 95]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --format   Output format                       [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx view <input>

Open a local 3D preview of a .mtlx or .mtlx.zip file in your browser

Positionals:
  input  Path to .mtlx or .mtlx.zip file                                         [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
```

<!-- end:cli_help -->

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
