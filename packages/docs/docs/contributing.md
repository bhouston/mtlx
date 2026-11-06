---
title: Contributing
---

Development uses the Node version in `.nvmrc` and the pnpm version pinned in the root `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm tsc
pnpm lint
pnpm test
pnpm docs:build
```

Run `pnpm docs:dev` to work on this documentation site. The build generates the CLI reference, API references, interactive application bundle, and static assets before Docusaurus builds the final artifact.

Every tracked change starts with an issue and a branch from current `main`. Use Conventional Commits, open a PR, and merge only when required CI checks pass. Package releases are separate from merges.

[Contribution workflow](https://github.com/bhouston/mtlx/blob/main/CONTRIBUTING.md) · [Release process](https://github.com/bhouston/mtlx/blob/main/RELEASING.md)

## Development conventions

Test fixtures live under `assets/` and are shared by every package's tests.

**Node definitions.** The registry is generated from upstream MaterialX sources in
`submodules/MaterialX` (a local source copy, not a registered submodule; only needed when
regenerating). `pnpm generate:nodes [path/to/MaterialX]` regenerates the registry and upstream
license; `pnpm check:nodes` verifies them without rewriting. Commit the generated files with any
matching core model changes.

**Keep `mtlx-core` pure.** The root entry has no `node:` imports, no `Buffer`, and no native
modules; the website imports only the root entry, which is the check. Filesystem helpers go in
`packages/core/src/node.ts` (`mtlx-core/node`), anything needing sharp in
`packages/core/src/textures.ts` (`mtlx-core/textures`), and pure functions take bytes, text, or a
reader callback such as `ResourceReader`.

**API conventions.** Functions, not classes, with plain interfaces for data. A function that takes
options has an `XOptions` interface and, when any option has a default, an `X_DEFAULTS` const.
Whole-material operations are a `Transform` so they compose with `transform(pkg, ...)`. Validation
returns `MaterialXValidationIssue[]` and never throws on bad input. Tag every export with
`@category` (`Parsing`, `Validation`, `Packaging`, `Transforms`, or `Textures`) and keep the documentation website current when an export's signature or behavior changes. Keep package READMEs focused on an overview, quick usage, and links to these guides.

**VS Code extension.** Build the VSIX with `pnpm --filter mtlx-vscode-extension package`, not
`pnpm tsc`, which replaces the bundled host entry with unbundled output.

Regenerate the terminal help reference with `pnpm docs:cli`; CI verifies it with `pnpm docs:cli --check`.
