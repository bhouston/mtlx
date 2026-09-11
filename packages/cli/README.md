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

# or an absolute, machine-specific shared library
mtlx x material.mtlx -o out/material.mtlx --texture-library /srv/shared-textures
```

It's a no-op for `.mtlx.zip` output: the archive format always stores textures at `./textures`
inside the zip, so `--texture-library` is ignored there (with a warning) — use it only when
writing loose `.mtlx` files.

Writes are deduplicated against whatever's already in the target directory: a texture whose bytes
match an existing file of the same name reuses it, and one that merely shares a name gets a `-2`
suffix instead of overwriting it — safe to point multiple materials at the same shared library.

Run `mtlx <command> --help` for the full option list of any command.

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)
