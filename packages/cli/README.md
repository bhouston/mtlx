# mtlx-cli

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [mtlx](https://github.com/bhouston/mtlx) suite. Installs the `mtlx` command
for validating, inspecting, packaging, previewing, and transforming MaterialX files
(`.mtlx`, `.mtlx.zip`). Requires Node.js 22 or later. Texture conversion uses sharp's native image
processing; browser-safe library imports are available separately through `mtlx-core`.

```sh
npm install --global mtlx-cli
```

`check`, `info`, and `transform` accept `--format text|json|yaml` (default `text`), so output can be piped into
other tools. `transform` (aliased `x`) takes one or more input files or glob patterns and one
`--output`/`-o` (like ffmpeg): it reads any format and writes any format, so packing and unpacking
are just a conversion with no options.

- **`-o` is a `.mtlx` or `.mtlx.zip` path** — every input is combined into that single file.
- **`-o` is a directory** (it already exists, or its path has no `.mtlx`/`.mtlx.zip` extension) —
  each input is converted separately into that directory, keeping its own format and its path
  relative to the inputs' common directory (so a glob matching same-named files from different
  directories doesn't collide) (batch mode). One bad input is reported and skipped rather than
  aborting the rest of the batch; the command exits non-zero if any input failed. Prints a
  one-line summary by default — pass `--verbose` to list every file written.

Quote glob patterns so `mtlx` expands them (with brace-list support), not your shell:

```sh
# validate a file; exits non-zero on any error-level issue, so it works as a CI gate
mtlx check material.mtlx

# print material/texture/document info
mtlx info material.mtlx.zip --format json

# pack a .mtlx (plus its textures) into a single .mtlx.zip
mtlx x material.mtlx -o material.mtlx.zip

# unpack a .mtlx.zip back into a .mtlx with textures alongside it
mtlx x material.mtlx.zip -o out/material.mtlx

# convert while packing: resize textures and switch their format
mtlx x material.mtlx -o material.mtlx.zip --max-image-size 2048 --image-format webp

# same result via a named preset: webp-preferred, 2048px max
mtlx x material.mtlx -o material.mtlx.zip --profile web

# combine an explicit list of materials into a single .mtlx.zip
mtlx x metal.mtlx wood.mtlx glass.mtlx -o combined.mtlx.zip

# ...or the same thing with a brace-expansion glob
mtlx x "{metal,wood,glass}.mtlx" -o combined.mtlx.zip

# combine every .mtlx in a directory
mtlx x "materials/*.mtlx" -o combined.mtlx.zip

# batch mode: resize+reformat every material's textures into its own file in out/
mtlx x "materials/*.mtlx" -o out/ --max-image-size 2048 --image-format webp

# open a 3D preview in your browser (local only, nothing is uploaded)
mtlx view material.mtlx
```

### Validation scope

`mtlx check material.mtlx` runs the basic rule group by default. Add `--strict` to fail on warnings,
or select additional groups explicitly:

```sh
mtlx check material.mtlx --strict --rules basic structure types resources renderer-support
```

| Rule group         | Scope                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| `basic`            | Recognized node categories and named ports.                                          |
| `structure`        | Duplicate names in a scope and resolvable node, graph, and named-output connections. |
| `types`            | Conservative checks against known input overloads and connection types.              |
| `resources`        | Resource graph completeness for files read through the Node loader.                  |
| `renderer-support` | Reports support as unassessed when no host capability inventory is available.        |

Issues include stable `code` and `rule` fields for automation. A check result only describes the
selected rules; it does not compile shaders or certify complete MaterialX or renderer compatibility.

### Dry-run planning

Add `--dry-run` to `mtlx x` to resolve inputs, validate, transform in memory, and plan output paths
without committing files. JSON and YAML output include structured stage results and planned changes.
See [Processing pipelines](https://github.com/bhouston/mtlx/blob/main/packages/core/PROCESSING.md) for the shared library API.

### `--profile`

`--profile <name>` is shorthand for a `--max-image-size`/`--image-format` pair. It's a filter,
not a blanket re-encode: a texture already in an acceptable format and under the size ceiling
passes through untouched, and only an incompatible or oversized texture is converted/resized.
`--max-image-size`/`--image-format` each override the profile's value if also given.

| Profile | max size | format                                                                                                       |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `web`   | 2048px   | prefers webp (non-web sources default to webp; webp/png/jpg/avif sources keep their format unless oversized) |

### `--texture-library`/`-tl`

Loose `.mtlx` output normally keeps textures under `textures/` next to the document.
`--texture-library <path>` copies them into a different directory instead — relative (resolved
against `--output`'s directory, `../` allowed) or absolute:

```sh
# copy material.mtlx's textures into a sibling directory instead of ./textures
mtlx x material.mtlx -o out/material.mtlx --texture-library ../shared-textures
# writes out/material.mtlx; textures land in shared-textures/ (a sibling of out/)

# or an absolute shared-library destination (XML references remain relative)
mtlx x material.mtlx -o out/material.mtlx --texture-library /srv/shared-textures
```

It's a no-op for `.mtlx.zip` output: resources remain inside the archive, retaining archive-relative paths
inside the zip, so `--texture-library` is ignored there (with a warning) — use it only when
writing loose `.mtlx` files.

Writes are deduplicated against whatever's already in the target directory: a texture whose bytes
match an existing file of the same name reuses it, and one that merely shares a name gets a `-2`
suffix instead of overwriting it — safe to point multiple materials at the same shared library.

Run `mtlx <command> --help` for the full option list of any command.

## Generated command reference

<!-- begin:cli_help -->

```text
mtlx <command>

Commands:
  mtlx check <input>         Run selected document checks on a .mtlx or .mtlx.zip file
  mtlx info <input>          Print information about a .mtlx or .mtlx.zip file
  mtlx transform <inputs..>  Convert, combine, or resize/reformat textures across one or more .mtlx
                             / .mtlx.zip files (glob patterns accepted), writing --output. A
                             directory --output batch-converts each input separately instead of
                             combining.                                                 [aliases: x]
  mtlx view <input>          Open a local 3D preview of a .mtlx or .mtlx.zip file in your browser

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]

Documentation: https://www.npmjs.com/package/mtlx-cli
```

```text
mtlx check <input>

Run selected document checks on a .mtlx or .mtlx.zip file

Positionals:
  input  Path to .mtlx or .mtlx.zip file                                         [string] [required]

Options:
  --version  Show version number                                                           [boolean]
  --help     Show help                                                                     [boolean]
  --strict   Fail on warnings as well as errors                           [boolean] [default: false]
  --rules    Rule groups to run; renderer checks require a capability inventory
         [array] [choices: "basic", "structure", "types", "resources", "renderer-support"] [default:
                                                                                          ["basic"]]
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
mtlx transform <inputs..>

Convert, combine, or resize/reformat textures across one or more .mtlx / .mtlx.zip files (glob
patterns accepted), writing --output. A directory --output batch-converts each input separately
instead of combining.

Texture options:
      --profile                Apply a named texture preset (e.g. "web": webp-preferred, 2048px
                               max); only touches incompatible textures             [choices: "web"]
      --max-image-size         Resize any texture whose longest edge exceeds this many pixels;
                               overrides --profile                                          [number]
      --image-format           Convert textures to this image format; overrides --profile
                                                             [choices: "webp", "png", "jpg", "avif"]
      --image-quality          Quality for lossy image formats (webp/jpg/avif)[number] [default: 95]
      --texture-library, --tl  Loose .mtlx output only: copy textures into this directory (relative
                               to --output) instead of ./textures. Ignored for .mtlx.zip output,
                               which always uses ./textures.                                [string]

Options:
      --version  Show version number                                                       [boolean]
      --help     Show help                                                                 [boolean]
  -o, --output   Output path; a .mtlx/.mtlx.zip path combines every input into one file, a directory
                 converts each input separately (same basename, same format) into that directory
                                                                                 [string] [required]
      --verbose  Batch mode: print every file written instead of just a one-line summary
                                                                          [boolean] [default: false]
      --dry-run  Transform and validate in memory, report planned files, and create no output
                                                                          [boolean] [default: false]
      --format   Output format                   [choices: "text", "json", "yaml"] [default: "text"]
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
