# Development

Repo-specific development notes that go beyond the workflow steps in
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Setup

```sh
pnpm install
pnpm build          # builds every package; the website build also regenerates the docs
pnpm test           # type-check + vitest across all packages
pnpm lint
pnpm docs:cli --check  # fails if generated CLI help (packages/cli/README.md) is stale
pnpm docs:opencli --check  # fails if the generated OpenCLI document (packages/cli/opencli.json) is stale
```

To use a local build of the CLI:

```sh
node packages/cli/bin/cli.js check material.mtlx
```

or `npm link` inside `packages/cli` so `mtlx` resolves to your checkout.

## Updating MaterialX node definitions

Keep upstream MaterialX sources in `submodules/MaterialX`. This is currently a local source
copy, not a registered Git submodule. It is needed only when updating or checking generated
node definitions; normal builds and runtime use the committed TypeScript registry.

```sh
pnpm generate:nodes  # build core's parser, regenerate the registry, and copy the upstream license
pnpm check:nodes     # verify generated files without rewriting them
# An alternate source tree can also be supplied:
pnpm generate:nodes /path/to/MaterialX
```

The generator reads `libraries/**/*.mtlx`, resolves nodedef inheritance, and retains port
types, defaults, groups, and UI metadata. It rejects duplicate names, missing parents, and
inheritance cycles. The output records the version from `CMakeLists.txt` and a SHA-256
fingerprint of that file and the library XML inputs. Review and commit the generated registry
and license with any matching core model changes; run `pnpm test` after regeneration.

Upstream sources are excluded from our formatter and linter. Update those sources using the
upstream project's workflow. The source copy currently supplied here contains a `.git` file
pointing to unavailable metadata; generation works without Git metadata. Before registering
it as a real submodule, preserve local changes, establish a valid checkout, and pin an upstream
commit. Once that commit is tracked, CI can check out the submodule and run `pnpm check:nodes`.

## Pull requests

Changes with test coverage are strongly preferred. Test fixtures live under `assets/` and are
shared by every package's tests.

### Node and web compatibility

The root `mtlx-core` entry must stay pure: no `node:` imports, no `Buffer`, no native modules.
Platform resources are injected by the caller, never created by the library. Concretely:

- Filesystem helpers go in `packages/core/src/node.ts` (`mtlx-core/node`).
- Anything that needs sharp goes in `packages/core/src/textures.ts` (`mtlx-core/textures`).
- Pure functions take bytes (`Uint8Array`), text, or a reader callback such as `ResourceReader`.

The website imports only the root entry, which is the check that this rule holds.

### API conventions

- Functions, not classes. Plain interfaces for data.
- A function that takes options has an `XOptions` interface and, when any option has a default,
  an `X_DEFAULTS` const.
- Anything that operates on a whole material is a `Transform` (`(pkg: MaterialXPackage) => void |
Promise<void>`) so it composes with `transform(pkg, ...)`.
- Validation returns `MaterialXValidationIssue[]`; it never throws on bad input.

## Documentation

Each published package documents itself: `packages/core/README.md`, `packages/cli/README.md`, and
`packages/viewer/README.md` list and demonstrate their key exported APIs, and that's what users see
on npm. Keep them current when you change an export's signature or behavior.

- Open with an italic one-line summary, then prose, then a fenced `ts` example, when adding a doc
  comment to an exported symbol.
- Tag every export with `@category`: `Parsing`, `Validation`, `Packaging`, `Transforms`, or
  `Textures`. `@internal` hides a symbol from the type declarations.

```sh
pnpm docs:cli    # splice `mtlx --help` output into packages/cli/README.md (commit the result)
pnpm docs:opencli  # regenerate packages/cli/opencli.json, the CLI's OpenCLI spec (commit the result)
```

`packages/cli/opencli.json` is an [OpenCLI](https://github.com/bcdxn/opencli) document generated
by `mtlx docgen` (via [clidoc](https://clidoc.dev)) from the CLI's own Yargs command tree. CI
validates it with [`bhouston/clidoc-action`](https://github.com/bhouston/clidoc-action) and fails
if it's stale (`pnpm docs:opencli --check`); regenerate and commit it whenever a command, flag, or
positional changes.

## Releasing

The extension build creates a bundled host entry; `pnpm tsc` can replace it with unbundled
compiler output, so always use the package script (which rebuilds) when preparing a VSIX.
Build the extension separately with `pnpm --filter mtlx-vscode-extension package`; test that VSIX
in VS Code before merging. Publishing to the VS Code Marketplace and Open VSX is automated as
part of the standard release (see [RELEASING.md](../RELEASING.md)), not a separate manual step.

The website deploys to Cloud Run from `main` via GitHub Actions.

Dependency audit findings appear as warnings in CI, so existing advisories stay visible
without blocking unrelated fixes.
