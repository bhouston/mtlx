# Changelog

## v0.x

### v0.2 (🚧 Unreleased)

**Features:**

- feat(core): Add `MaterialXPackage` and the `transform(pkg, ...transforms)` pipeline; `resizeTextures()` is the first transform
- feat(core): Add `mtlx-core/node` entry with `loadMaterialXPackage`, `writeMaterialXPackage`, and `checkMaterialX`
- feat(core): Root entry is now pure (no `node:fs`, no `Buffer`); `.mtlz` and `.mtlx.zip` archives can be created and checked in the browser
- feat(cli): `transform <input> <output>` converts between formats and applies texture transforms; it replaces `pack` and `unpack`
- feat(docs): API reference and guides generated with TypeDoc at `/docs`

**Breaking:**

- `readMaterialX`, `writeMaterialX`, and `loadMaterialXDocument` moved from `mtlx-core` to `mtlx-core/node`
- `packMaterialX`, `packMaterialXZip`, `unpackMaterialZ`, and `unpackMaterialXZip` are replaced by `loadMaterialXPackage` + `writeMaterialXPackage` (the output extension picks the format); `checkMaterialXPackage` and `checkMaterialXZipPackage` by `checkMaterialX`
- `TransformResourceHook` is removed; use `transform(pkg, resizeTextures(options))`
- `resolveMaterialXResources` takes a `ResourceReader` callback instead of a root directory

### v0.1

- Initial release: `mtlx-core`, the `mtlx` CLI, the web viewer, and the VS Code extension
