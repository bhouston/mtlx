---
title: Command line
group: Guides
---

# Command line

The `mtlx` command wraps the library for validating, inspecting, converting, and transforming
MaterialX files. `transform` reads any format and writes any format, so packing and unpacking are
just a conversion with no options.

```sh
npm install --global mtlx-cli
```

<details>
  <summary><i>Troubleshooting</i></summary>

mtlx uses [sharp](https://sharp.pixelplumbing.com/) to resize and reformat textures. If
installation fails on sharp, consult the [sharp installation](https://sharp.pixelplumbing.com/install)
page for your platform.

</details>

Every command accepts `--format text|json|yaml` (default `text`), so output can be piped into
other tools:

```sh
mtlx check material.mtlx
mtlx info material.mtlz --format json
mtlx transform material.mtlx material.mtlz                    # pack
mtlx transform material.mtlz out/material.mtlx                # unpack
mtlx transform material.mtlx material.mtlz --max-image-size 2048 --image-format webp
```

`check` exits non-zero when any error-level issue is found, so it works as a CI gate.

## Reference

The following is generated from `mtlx --help` by `pnpm docs:cli`; do not edit it by hand.

<!-- begin:cli_help -->

```text
mtlx <command>

Commands:
  mtlx check <input>               Validate a .mtlx, .mtlz, or .mtlx.zip file
  mtlx info <input>                Print information about a .mtlx, .mtlz, or .mtlx.zip file
  mtlx transform <input> <output>  Convert between .mtlx, .mtlz, and .mtlx.zip (pack/unpack),
                                   optionally resizing or reformatting textures

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]

Documentation: https://mtlx.ben3d.ca/docs/
```

```text
mtlx check <input>

Validate a .mtlx, .mtlz, or .mtlx.zip file

Positionals:
  input  Path to .mtlx, .mtlz, or .mtlx.zip file                                 [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --format   Output format                       [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx info <input>

Print information about a .mtlx, .mtlz, or .mtlx.zip file

Positionals:
  input  Path to .mtlx, .mtlz, or .mtlx.zip file                                 [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --format   Output format                       [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx transform <input> <output>

Convert between .mtlx, .mtlz, and .mtlx.zip (pack/unpack), optionally resizing or reformatting
textures

Positionals:
  input   Path to .mtlx, .mtlz, or .mtlx.zip file                                [string] [required]
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

<!-- end:cli_help -->
