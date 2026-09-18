# Contributing

mtlx is a pnpm monorepo. All code is TypeScript (ESM), formatted with oxfmt and linted with
oxlint; both run on staged files via husky. This file is the single source of truth for the
workflow, for every contributor including Claude and Codex.

## Issue → branch → implementation → PR

1. Before starting a feature or other tracked change, create a GitHub issue using the
   feature/change template. Include what changes, why, constraints, and testable acceptance
   criteria. Reuse an existing issue when it already covers the request.
2. Fetch origin and branch from `origin/main`. Use `feature/<issue>-<short-description>` for
   features; `fix/`, `chore/`, `docs/`, `refactor/`, and `test/` are also accepted. Example:
   `feature/42-batch-export`. Never commit directly to `main`.
3. Implement and validate the acceptance criteria. Every commit must use Conventional Commits
   (see below). Reference the issue in the commit body where useful.
4. Run `pnpm build`, `pnpm tsc`, `pnpm lint`, `pnpm test`, and `pnpm docs:cli --check`. Run
   `pnpm audit --audit-level=high` and review findings. Format changed files with
   `pnpm exec oxfmt <files>`.
5. Push the branch and open a PR against **main**. Give the PR a Conventional Commit title and
   include `Closes #<issue>`, a description of the resulting behavior, and validation results.
   Do not merge your own work unless the maintainer requested a merge.
6. Merging a PR runs CI but never publishes. The maintainer publishes separately by dispatching
   the `Release` workflow on `main` (see [RELEASING.md](RELEASING.md)); there is no promotion or
   sync-back branch to keep aligned.

GitHub automatically closes referenced issues when their closing commits reach the default
branch (`main`).

## Commit format and versions

Use `type(optional-scope): description`. Allowed types are `feat`, `fix`, `perf`, `docs`,
`chore`, `refactor`, `test`, `style`, `build`, `ci`, and `revert`.

- `feat: add batch export` triggers a minor release.
- `fix(cli): handle missing input` and `perf:` trigger patch releases.
- `feat!: remove the legacy loader` or a `BREAKING CHANGE: explanation` footer triggers a major
  release, including when attached to another type.
- Other types do not normally trigger a release. Reverts are interpreted by the release analyzer.

Use an imperative, concise description. Add a blank line before a body or footer. Husky
validates commit messages after `pnpm install`; CI validates feature commits and PR titles too.
Git-generated merge commits are exempt from commitlint.

Do not manually bump versions or write changelog entries. `mtlx-core`, `mtlx-viewer`, and
`mtlx-cli` release together. See [RELEASING.md](RELEASING.md) for the release mechanics and
setup.

## Setup

```sh
pnpm install
pnpm build   # builds every package; the website build also regenerates the docs
pnpm test    # type-check + vitest across all packages
pnpm lint
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

Before adding a feature, please open an issue to discuss it. Changes with test coverage are
strongly preferred. Test fixtures live under `assets/` and are shared by every package's tests.
PRs are merged with merge commits; do not squash.

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
pnpm docs:cli --check # fail if generated CLI help is stale (also runs in CI)
pnpm docs:cli    # splice `mtlx --help` output into packages/cli/README.md (commit the result)
```

## Releasing

`mtlx-core`, `mtlx-viewer`, and `mtlx-cli` release together via a manually dispatched GitHub
Actions workflow, never on every push. See [RELEASING.md](RELEASING.md) for the release
mechanics and one-time npm trusted publishing setup.

`pnpm pack:release` and `pnpm check:release` remain available for local, pre-publish
verification of the exact tarballs without publishing anything.

The extension build creates a bundled host entry; `pnpm tsc` can replace it with unbundled
compiler output, so always use the package script (which rebuilds) when preparing a VSIX.
Build the extension separately with `pnpm --filter mtlx-vscode-extension package`; test that VSIX
in VS Code before merging. Publishing to the VS Code Marketplace and Open VSX is automated as
part of the standard release (see [RELEASING.md](RELEASING.md)), not a separate manual step.

The website deploys to Cloud Run from `main` via GitHub Actions.

## Development and CI

Use the Node version in `.nvmrc` and the pinned pnpm version in `package.json`, then run
`pnpm install --frozen-lockfile`.

CI checks build, types, lint, tests, generated CLI docs, and a dependency audit (findings
appear as warnings, so existing advisories stay visible without blocking unrelated fixes). A
separate `contribution` job validates branch naming, the linked issue, and Conventional Commit
PR titles and commits.
