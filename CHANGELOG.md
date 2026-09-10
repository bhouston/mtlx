# Changelog

## v0.x

### v0.2 (🚧 Unreleased)

**Features:**

- feat(core): Add `MaterialXPackage` and the `transform(pkg, ...transforms)` pipeline; `resizeTextures()` is the first transform
- feat(core): Add `mtlx-core/node` entry with `loadMaterialXPackage`, `writeMaterialXPackage`, `packMaterialX`, `unpackMaterialX`, and `checkMaterialX`
- feat(core): Root entry is now pure (no `node:fs`, no `Buffer`); `.mtlz` and `.mtlx.zip` archives can be created and checked in the browser
- feat(cli): `transform` accepts an output path in any format; texture flags are grouped in `--help`
- feat(docs): API reference and guides generated with TypeDoc at `/docs`

**Breaking:**

- `readMaterialX`, `writeMaterialX`, and `loadMaterialXDocument` moved from `mtlx-core` to `mtlx-core/node`
- `packMaterialXZip`, `unpackMaterialZ`, `unpackMaterialXZip`, `checkMaterialXPackage`, and `checkMaterialXZipPackage` are replaced by `packMaterialX` (output extension picks the format), `unpackMaterialX`, and `checkMaterialX`
- `TransformResourceHook` is removed; use `transform(pkg, resizeTextures(options))`
- `resolveMaterialXResources` takes a `ResourceReader` callback instead of a root directory

### v0.1

- Initial release: `mtlx-core`, the `mtlx` CLI, the web viewer, and the VS Code extension
