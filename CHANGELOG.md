# Changelog

## Unreleased

These changes are in the repository and have not been published as a new package release.

- Preserve XML element order, explicit attributes, comments, and mixed text during semantic round trips.
- Make `document.elements` canonical and expose node/graph inspection as readonly derived snapshots.
- Bound XML and archive processing and strengthen package resource-path handling.
- Add selectable validation rule groups, stable issue codes, and strict CLI checks.
- Add staged processing reports and CLI dry runs with shared batch destination planning.
- Resolve nested roots, recursive includes and inherited file prefixes; plan collision-safe texture names.
- Preserve existing extension conversion outputs, summarize batch results, and report parse failures as invalid.
- Restore and refresh extension previews with explicit readiness messages and release viewer resources on replacement.
- Pack complete npm artifacts and verify them in an isolated production consumer before explicit publication.

## 0.4.x API baseline

The core, CLI, and extension manifests currently use version 0.4.0; the shared viewer package is
versioned independently. The earlier notes below describe the API transition, not a verified
publication date.

**Features:**

- feat(core): Add `MaterialXPackage` and the `transform(pkg, ...transforms)` pipeline; `resizeTextures()` is the first transform
- feat(core): Add `mtlx-core/node` entry with `loadMaterialXPackage`, `writeMaterialXPackage`, and `checkMaterialX`
- feat(core): Root entry is now pure (no `node:fs`, no `Buffer`); `.mtlx.zip` archives can be created and checked in the browser
- feat(cli): `transform <input> -o <output>` converts between formats and applies texture transforms; it replaces `pack` and `unpack`
- feat(docs): API reference and guides generated with TypeDoc at `/docs`

**Breaking:**

- `.mtlz` support is removed. It was never a widely-adopted standard, and keeping a bespoke container format alongside `.mtlx.zip` added surface area and risk without enough upside. `.mtlx` and `.mtlx.zip` remain the two supported formats; `detectFormat` now throws a clear "unsupported format" error for `.mtlz` paths instead of misdetecting them.
- `readMaterialX`, `writeMaterialX`, and `loadMaterialXDocument` moved from `mtlx-core` to `mtlx-core/node`
- `packMaterialX`, `packMaterialXZip`, `unpackMaterialZ`, and `unpackMaterialXZip` are replaced by `loadMaterialXPackage` + `writeMaterialXPackage` (the output extension picks the format); `checkMaterialXPackage` and `checkMaterialXZipPackage` by `checkMaterialX`
- `TransformResourceHook` is removed; use `transform(pkg, resizeTextures(options))`
- `resolveMaterialXResources` takes a `ResourceReader` callback instead of a root directory

## 0.1

- Initial release: `mtlx-core`, the `mtlx` CLI, the web viewer, and the VS Code extension
