# Contributing

mtlx is a pnpm monorepo. All code is TypeScript (ESM), formatted with oxfmt and linted with
oxlint; both run on staged files via husky.

## Required workflow

These rules apply to every contributor, including Claude and Codex. `AGENTS.md` and
`CLAUDE.md` point here; keep the standard in this file.

1. Before implementing a feature or fix, open or reuse a GitHub issue. Include a description,
   motivation, constraints, and acceptance criteria (see the feature issue template).
2. Start from current `dev` and name the branch `feature/42-short-description` or
   `fix/42-short-description`. Other Conventional Commit type prefixes are allowed.
   Never commit contributor changes directly to `main` or `dev`.
3. Use Conventional Commits for every commit: `type(scope): description`. Allowed types are
   `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`, and `revert`.
   `feat` produces a minor release; `fix` and `perf` produce a patch. An exclamation mark
   (`feat(core)!: ...`) or `BREAKING CHANGE:` footer produces a major release. Other types
   do not release on their own. Explain breaking changes in the commit body.
4. Run the checks below and open a PR against **dev**, with a Conventional Commit title,
   `Closes #42` matching the branch issue, and a description of the result and validation.
   The commit-msg hook and PR policy CI enforce these conventions. For squash merges,
   retain the conventional title and any breaking-change footer in the final commit.
5. Release through a PR from this repository's **dev to main**, titled
   `chore(release): promote dev to main`. Use a **merge commit**, never squash or rebase
   this promotion: the release tool needs the original feature/fix commits. Only pushes
   to `main` can publish; ordinary merges to `dev` cannot.
6. Bring `main` history back into `dev` through an issue-linked synchronization branch
   and PR before starting the next release cycle, preserving ancestry. Releases do not create generated commits, so there are no version-file conflicts.

GitHub's default branch should be `dev` so feature PRs close linked issues when merged.
Require the `Unit` and `PR policy` checks on `dev` and `main`, and keep merge commits enabled.
The CI gates must pass before merging. Install hooks with `pnpm install`; do not bypass them.

## Setup

```sh
pnpm install
pnpm build   # builds every package; the website build also regenerates the docs
pnpm test    # type-check + vitest across all packages
pnpm lint
pnpm test:coverage # all source files, including untested files
pnpm test:workflow # release classification and PR policy
pnpm size          # run after building; gzip size budgets
pnpm audit --audit-level high
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

Semantic Release runs in `.github/workflows/release.yml` after the full CI suite passes.
It analyzes Conventional Commits, assigns one version to `mtlx-core`, `mtlx-viewer`, and
`mtlx-cli`, generates changelog entries, builds and checks tarballs, and publishes those
exact tarballs in dependency order through npm OIDC. `main` is the only release branch.

Release versions and the cumulative generated `CHANGELOG.md` are attached to each GitHub
release together with the three tarballs. The source manifests are development snapshots;
Git tags and the manifests inside published tarballs are authoritative release versions.
The historical source changelog is retained. No bot commits or branch-protection bypasses
are needed. Do not manually bump package versions or add new release entries to the source
changelog. To inspect packages locally without publishing:

```sh
pnpm pack:release
pnpm check:release
```

The checker installs the exact tarballs into a temporary production consumer and exercises
headless core APIs, CLI operations, preview assets, and executable README examples.
Publication never rebuilds these tarballs after verification.

### Initial activation and npm trusted publishing

This repository has no existing release tags. Semantic Release's first release will be
**1.0.0**, followed by normal Conventional Commit versioning. Do not invent a tag for the
unpublished development version 0.6.0. On setup, npm had core/cli 0.4.0 and no viewer package.

1. `mtlx-viewer` must exist on npm before its trust settings can be configured. An npm owner
   must bootstrap it once using interactive npm authentication: run `pnpm pack:release` and
   `pnpm check:release`, then publish core, viewer, and CLI's checked 0.6.0 tarballs in that
   order. This also ensures viewer's workspace dependency resolves. Skip only a package
   version already published after verifying its contents; npm versions are immutable.
   Do not add that interactive credential to CI.
2. In each package's npm settings (`mtlx-core`, `mtlx-viewer`, `mtlx-cli`), add a GitHub Actions
   trusted publisher: user **bhouston**, repository **mtlx**, workflow filename **release.yml**,
   environment **blank**. Allow direct `npm publish` if the UI asks. The workflow uses
   GitHub-hosted runners, Node from `.nvmrc`, and requires npm >=11.5.1.
3. Once all three are configured, enable releases:
   `gh variable set NPM_TRUSTED_PUBLISHING_READY --body true --repo bhouston/mtlx`.
   Until then the publish job is skipped. No `NPM_TOKEN` or `NODE_AUTH_TOKEN` is needed.
4. Merge this setup into `dev`, then promote `dev` to `main` with a merge commit when ready.
   Keep the original feature commits. A docs/chore-only history will not trigger a release.

See [npm's trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/).
An authenticated GitHub Actions publication is required to verify OIDC end to end.
If publishing partially fails, do not blindly rerun or delete tags: Semantic Release tags
before publication and npm cannot roll back versions. Inspect the run and published package
versions; complete missing publications from the exact verified artifacts using a controlled
recovery workflow with the same trusted identity, then restore the GitHub release assets.

### Quality reports

Coverage thresholds include untested source, excluding declarations, tests, and generated
files. Raise thresholds as coverage improves. CI uploads the full report, enforces size-limit
budgets for core JavaScript and the bundled CLI preview, and fails on high/critical dependency
audit findings. Lower-severity audit findings remain visible in the job log. Successful `dev` pushes update
a numeric coverage badge on the dedicated `coverage` branch; no external reporting account
is required. The badge becomes available after the first successful run on `dev`.

The extension build creates a bundled host entry; `pnpm tsc` can replace it with unbundled
compiler output, so always use the package script (which rebuilds) when preparing a VSIX.
Build the extension separately with `pnpm --filter mtlx-vscode-extension package`; test that VSIX
in VS Code before publishing it through the extension Marketplace workflow.

The website deploys to Cloud Run from `main` via GitHub Actions.

## Reusing the pilot

After the first successful OIDC release, extract the shared policy, agent pointers, commitlint
configuration, hooks, issue/PR templates, and CI/release files into a GitHub template repository.
Use `node scripts/export-workflow.mjs /path/to/new-template` to copy these files into a new
local directory (it refuses to overwrite an existing directory). Review the generated rollout
notes before using it elsewhere: package layout, repository identity, dependencies, coverage
and size budgets, bootstrap state, and npm trust are repository-specific. Create and mark the
remote template repository only after this pilot's first live release is verified.
