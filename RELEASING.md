# Releasing

Releases are manual and maintainer-only. Merging to `main` never publishes.

## Running a Release

```sh
gh workflow run release.yml --ref main                  # release
gh workflow run release.yml --ref main -f dry_run=true  # preview only, publishes nothing
```

When there are no release-worthy commits since the last `v*` tag, the run is a no-op.

## What the Workflow Does

1. Refuses any ref other than `main`.
2. Runs the full CI workflow on the dispatched commit.
3. Stops if `main` has moved since the dispatch.
4. Installs, builds, and runs `pnpm release`, which is semantic-release.
5. semantic-release computes the next version, creates the `v<version>` tag and GitHub Release, and publishes.

Releases run one at a time and never cancel a publish in progress. npm packages publish through npm trusted publishing (GitHub OIDC), so no `NPM_TOKEN` is stored.

## Versioning

The version comes from the Conventional Commits since the last `v*` tag. The highest change wins:

- `feat` produces a minor release.
- `fix` and `perf` produce a patch release.
- `!` or a `BREAKING CHANGE:` footer produces a major release.
- Other types do not trigger a release.

Everything this repository publishes shares one version. `package.json` versions in source are development snapshots; the Git tag and the registry hold the released version. [GitHub Releases](https://github.com/bhouston/mtlx/releases) is the changelog of record.

## One-Time Setup

1. On npmjs.com, open each package's Trusted Publisher settings, choose GitHub Actions, and enter organization or user `bhouston`, repository `mtlx`, workflow filename `release.yml`, and environment name `npm`.
2. Protect `main`: require pull requests and the CI checks, allow merge commits, and block force pushes and deletion.
3. If the repository uploads coverage to Codecov, add the `CODECOV_TOKEN` repository secret.

## Recovery

Publishing is not atomic. If a run fails part way, compare the registry versions, the `v<version>` tag, and the workflow log, then finish what is missing from the same release commit. If publishing succeeded but the GitHub Release failed, create the release from the existing tag. Never republish a version, delete a published version, or move a release tag. Resolve the failure before dispatching another release.

## Repository Specifics

### Published Artifacts

- npm packages `mtlx-core`, `mtlx-viewer`, `mtlx-sdk`, and `mtlx-cli`, published in that order and sharing one version. Each GitHub Release also attaches the four npm tarballs.
- The VS Code extension `mtlx-vscode-extension` (`packages/vscode-extension`), published to the VS Code Marketplace and Open VSX on the same version stream.
- The documentation site, built from the release tag and deployed to GitHub Pages.

`mtlx-editor` is a source workspace package and is not published.

### VS Code Extension

The extension is never `npm publish`ed. `release.config.js` pins its `package.json` version to the release version, then `scripts/release-vscode-extension.mjs` builds it, packages it with `vsce`, and publishes it to both marketplaces. Both repository secrets are required, and the run fails if either is missing:

- `VSCE_PAT`: Azure DevOps personal access token for the `benhouston3d` publisher.
- `OVSX_PAT`: Open VSX access token.

### Website

After a real release (including a recovered one, never a dry run), `release.yml` calls `docs.yml`, which builds the documentation site from the release tag and deploys it to GitHub Pages. Merges to `main` do not deploy it.

### Recovery Mode

For an interrupted release, dispatch recovery on `main` with the existing tag. Preview first:

```sh
gh workflow run release.yml --ref main -f recover_tag=vX.Y.Z -f dry_run=true
gh workflow run release.yml --ref main -f recover_tag=vX.Y.Z
```

The tag must be a stable lightweight `vX.Y.Z` tag that is an ancestor of `main`. The run checks out that tag's commit, reuses its release configuration, and finishes the missing artifacts without creating or moving tags. It skips npm and marketplace versions that already exist, stops on registry errors other than a missing-version 404, and creates the GitHub Release with all four tarballs only after publishing succeeds. It refuses to proceed if a GitHub Release, including a draft, already exists for the tag. Current `main` must pass CI, and the tagged source must have passed CI in the original run.

semantic-release pushes the tag and its `refs/notes/semantic-release-v<version>` notes before any publish plugin runs, so a failed notes push can leave a tag with nothing published. Repair the missing notes (`{"channels":[null]}` for the default channel) before recovering.

### Local Validation

`pnpm pack:release` builds the exact tarballs and `pnpm check:release` installs them in a clean consumer outside the workspace.
