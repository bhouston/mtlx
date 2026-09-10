---
title: Command line
group: Guides
---

# Command line

The `mtlx` command wraps the library for validating, inspecting, packing, unpacking, and
transforming MaterialX files.

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
mtlx pack material.mtlx --max-image-size 2048 --image-format webp
mtlx transform material.mtlx material.mtlz --image-format webp --image-quality 90
mtlx unpack material.mtlz --output-dir material/
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
  mtlx pack <input>                Pack a root .mtlx file and its resources into a .mtlz (or
                                   .mtlx.zip) archive
  mtlx transform <input> [output]  Resize and/or reformat textures, writing to any of .mtlx, .mtlz,
                                   or .mtlx.zip
  mtlx unpack <input>              Unpack a .mtlz or .mtlx.zip archive into a directory

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
mtlx pack <input>

Pack a root .mtlx file and its resources into a .mtlz (or .mtlx.zip) archive

Positionals:
  input  Path to root .mtlx file                                                 [string] [required]

Texture options:
      --max-image-size  Resize any texture whose longest edge exceeds this many pixels      [number]
      --image-format    Convert textures to this image format[choices: "webp", "png", "jpg", "avif"]
      --image-quality   Quality for lossy image formats (webp/jpg/avif)       [number] [default: 95]

Options:
      --version  Show version number                                                       [boolean]
      --help     Show help                                                                 [boolean]
  -o, --output   Output path; .mtlx.zip writes the relaxed container (default: <input>.mtlz)[string]
      --format   Output format                   [choices: "text", "json", "yaml"] [default: "text"]
```

```text
mtlx transform <input> [output]

Resize and/or reformat textures, writing to any of .mtlx, .mtlz, or .mtlx.zip

Positionals:
  input   Path to .mtlx, .mtlz, or .mtlx.zip file                                [string] [required]
  output  Output path; format follows the extension (default: <name>-transformed/<name>.mtlx)
                                                                                            [string]

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
mtlx unpack <input>

Unpack a .mtlz or .mtlx.zip archive into a directory

Positionals:
  input  Path to .mtlz or .mtlx.zip archive                                      [string] [required]

Options:
      --version     Show version number                                                    [boolean]
      --help        Show help                                                              [boolean]
  -d, --output-dir  Output directory                                                        [string]
      --force       Delete the output directory before extracting         [boolean] [default: false]
      --format      Output format                [choices: "text", "json", "yaml"] [default: "text"]
```

<!-- end:cli_help -->
