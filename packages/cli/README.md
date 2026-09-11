# mtlx-cli

<img src="https://raw.githubusercontent.com/bhouston/mtlx/main/assets/logo.webp" alt="mtlx logo" width="96">

[![npm version](https://img.shields.io/npm/v/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![npm downloads](https://img.shields.io/npm/dm/mtlx-cli.svg)](https://www.npmjs.com/package/mtlx-cli)
[![ci](https://github.com/bhouston/mtlx/actions/workflows/ci.yml/badge.svg)](https://github.com/bhouston/mtlx/actions/workflows/ci.yml)

Part of the [Mtlx suite of web-focused MaterialX tools](https://mtlx.ben3d.ca). Installs the `mtlx` command
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

Quote glob patterns so `mtlx` expands them (including brace lists).

## Common workflows

### Collect materials into one library archive

Bundle a collection into one `.mtlx.zip` so it is easy to distribute or load as a material
library. The output contains a merged document and its resources. Material, nodegraph, and
other top-level names must be unique across inputs. Colliding resource paths are renamed;
archive merging does not deduplicate identical textures.

```sh
mtlx x "materials/**/*.mtlx" -o dist/library.mtlx.zip
```

### Share textures across a local material library

Keep materials as separate documents while collecting their textures in one directory. This
is useful when several materials use the same texture: an existing texture with the same
filename and identical bytes is reused, while different content gets a new filename. This
reuse does not search for identical content under unrelated filenames.

```sh
mtlx x "materials/*.mtlx" -o dist/materials/ --texture-library ../textures
```

For this flat input collection, documents go into `dist/materials/` and reference textures
under `dist/textures/`. `--texture-library` applies only to loose `.mtlx` output.

### Package a material during a build

Check a source material before producing a portable artifact for a website or asset release.
The `&&` runs packaging only if the selected checks pass; `--strict` treats warnings as
failures too. The web profile resizes oversized textures and converts non-web image formats.

```sh
mtlx check materials/wood.mtlx --rules basic structure types resources --strict &&
  mtlx x materials/wood.mtlx -o dist/wood.mtlx.zip --profile web
```

Repeat this command for each build input that needs its own archive. A directory output
preserves each input's format, so writing loose inputs to `dist/` alone does not create ZIPs.

### Optimize a collection for the web

Prepare an entire collection while keeping one output document per input. The web profile
caps textures at 2048 pixels on their longest edge and preserves compatible image formats;
compatible textures already within the limit pass through untouched. Nested input paths
are preserved relative to the inputs' common directory.

```sh
mtlx x "materials/**/*.mtlx" -o dist/materials/ --profile web
```

### Review changes before writing outputs

Use a dry run to inspect planned output paths and texture changes before committing a
conversion. JSON output makes the report easy to save or consume in build tooling. Inputs
are loaded, checked, and transformed in memory, but output files are not written.

```sh
mtlx x material.mtlx -o dist/material.mtlx.zip --profile web --dry-run --format json > plan.json
```

## Command examples and options

### Inspect and preview

```sh
mtlx check material.mtlx
mtlx check "materials/*.mtlx" --strict                     # every match; exits 1 if any fail
mtlx info material.mtlx.zip --format json
mtlx view material.mtlx
```

The preview's bottom controls toggle bloom and denoised GTAO and select tone mapping. Bloom and
AO start enabled, with Neutral tone mapping. The totem rotates once every 40 seconds.

### Pack and unpack

```sh
mtlx x material.mtlx -o material.mtlx.zip
mtlx x material.mtlx.zip -o out/material.mtlx
```

### Optimize textures

```sh
# Explicit format: re-encode textures as WebP and resize to 2048px.
mtlx x material.mtlx -o material.mtlx.zip --max-image-size 2048 --image-format webp
# Preset: resize to 2048px and preserve compatible image formats.
mtlx x material.mtlx -o material.mtlx.zip --profile web
```

### Merge materials

```sh
mtlx x metal.mtlx wood.mtlx glass.mtlx -o combined.mtlx.zip
mtlx x "{metal,wood,glass}.mtlx" -o combined.mtlx.zip
```

### Batch processing

```sh
mtlx x "materials/**/*.mtlx" -o out/ --max-image-size 2048 --image-format webp
mtlx x "materials/**/*.mtlx" -o out/ --format json > batch.json
```

JSON and YAML batch output use a versioned object (previously a bare results array):
`{ schemaVersion: 1, kind: "batch", success, dryRun, outputDir, total, succeeded, failed, results, failures }`.
`results` contains per-input processing reports, including failed stages. `failures` lists every
failed input and message, including errors before a processing report could be created. Counts
cover all expanded inputs. Successful outputs remain available when another input fails; exit
status is 1 if any failed. Inspect `failures`, fix those inputs, then rerun only those paths.
An unmatched input pattern is an input-expansion error before processing begins.

Text output retains the terse summary; `--verbose` prints per-input reports. Directory outputs
preserve paths relative to the inputs' common directory. `--dry-run` uses the same result envelope
and reserves planned shared texture names across inputs without writing files.

### Validation scope

`mtlx check material.mtlx` runs the basic rule group by default. It accepts several paths or glob
patterns and checks every match, exiting non-zero if any file fails. Add `--strict` to fail on
warnings, or select additional groups explicitly:

```sh
mtlx check material.mtlx --strict --rules basic structure types resources
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
  mtlx check <inputs..>      Run selected document checks on one or more .mtlx or .mtlx.zip files
                             (glob patterns accepted)
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
mtlx check <inputs..>

Run selected document checks on one or more .mtlx or .mtlx.zip files (glob patterns accepted)

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
                               whose resources remain inside the archive.                   [string]

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
