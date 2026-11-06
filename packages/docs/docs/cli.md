---
title: CLI
---

`mtlx-cli` provides the `mtlx` command for local MaterialX workflows. Its `mtlx-ai` alias also exposes the MTLX.ai service commands.

```sh
npm install -g mtlx-cli
mtlx --help
mtlx info material.mtlx
mtlx check material.mtlx
mtlx view material.mtlx
```

## Packages and conversions

Loose `.mtlx` documents reference sibling textures. `.mtlx.zip` packages carry those resources with the document. The CLI can pack and unpack materials and transform them for delivery. Run a command's `--help` for the currently supported options; the command reference in this sidebar is generated from the same CLI source at build time.

## Rendering

```sh
mtlx render material.mtlx -o preview.png --view sphere --ibl studio
```

Use the generated command reference for view presets, texture channels, resolution, supersampling, and output format choices. CLI exports retain a transparent background unless the selected view or `--background` requests an environment backdrop.

The rendering commands use a browser and Three.js. They need a working GPU-backed browser context. Validation, inspection, and package manipulation do not require a renderer.

## Automation

Use exit codes and machine-readable command output rather than parsing formatted terminal text. The CLI also exposes an MCP server for agent workflows; see [agents and automation](agents.md).

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
failures too. The web profile resizes oversized textures and normalizes EXR compression to PIZ
(the safest choice for Three.js/Babylon).

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

## Choose output formats

`--profile web` resizes textures and chooses web-compatible formats. Override it with `--max-image-size`, `--image-format`, and `--image-quality`. For mixed SDR/HDR resources, use targets such as `--image-format webp,exr:piz`; HDR sources use the HDR target. An HDR source converted only to an SDR target is clipped rather than tone-mapped.

Use `--texture-library <directory>` with loose `.mtlx` output to share textures across a local library. ZIP output keeps resources inside the archive.

## Validation and automation

`mtlx check` checks selected document rules, resources, and renderer categories. A passing check does not guarantee shader compilation or full MaterialX conformance. Use `--strict` to treat warnings as failures and `--format json` for machine-readable results. See each command's generated reference for its exit codes and options.

The [agent guide](agents.md) covers MCP and scripted editing. Use the SDK for programmatic access to the hosted MTLX.ai API.
