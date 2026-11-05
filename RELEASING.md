# Releases

## Running a release

Releases are never triggered by pushes or merges to `main`. When ready to publish, the maintainer dispatches the workflow:

```sh
gh workflow run release.yml --ref main
```

Add `-f dry_run=true` to validate versioning, the changelog, and staged packages without publishing or tagging. The workflow refuses to run against any ref other than `main`. If there are no release-worthy commits since the last tag, the run succeeds as a no-op and says so in the run summary.

## One-time activation

The workflow is installed in `.github/workflows/release.yml`.

1. On npmjs.com, open Settings → Trusted Publisher for **each** package: `mtlx-core`, `mtlx-viewer`, `mtlx-sdk`, and `mtlx-cli`. Select GitHub Actions and enter:

   | Field                | Value         |
   | -------------------- | ------------- |
   | Organization or user | `bhouston`    |
   | Repository           | `mtlx`        |
   | Workflow filename    | `release.yml` |
   | Environment name     | `npm`         |

   These are package settings, not repository secrets. No `NPM_TOKEN` or `NODE_AUTH_TOKEN` is needed. The release job publishes with `pnpm` (pinned to `packageManager` in `package.json`) with `id-token: write`; npm supplies automatic provenance for trusted-publisher packages. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

   For a new package such as `mtlx-sdk`, npm requires an initial manual publish before trusted publishing can be configured. Publish a placeholder prerelease from a temporary directory under a separate dist-tag (for example `0.0.0-bootstrap.0` with `--tag bootstrap`), then configure the fields above. Do not bump the source package version or create a Git release tag for this bootstrap. The environment must match the release job’s `environment: npm`.

2. If any of `mtlx-core`, `mtlx-viewer`, `mtlx-sdk`, or `mtlx-cli` are already published on npm from before this workflow existed, tag the commit that matches the currently published versions as a release baseline (for example `git-dedup tag v0.4.0 <sha> && git-dedup push origin v0.4.0`) before the first dispatch, so semantic-release resumes versioning from there instead of restarting at `1.0.0`. Skip this step if none of the packages have ever been published; semantic-release will then start at `1.0.0`.
3. `main` is protected: PRs, an up-to-date `ci` check, and resolved conversations are required, including for administrators. Force pushes and deletion are disabled. Merge commits are enabled; linear history is not required. `main` is the default branch so GitHub closes delivered issues on merge.
4. Configure the npm publishers before the first release, then dispatch `Release` on `main` (see above) when ready to publish.
5. Configure the repository `VSCE_PAT` (Azure DevOps personal access token for the `benhouston3d` publisher) and `OVSX_PAT` (Open VSX access token) secrets so the release job can publish the VS Code extension.

## Versioning and artifacts

Semantic-release analyzes Conventional Commits since the last `v*` tag. `feat` produces a minor, `fix`/`perf` a patch, and `!` or `BREAKING CHANGE:` a major. The highest change wins. A docs/chore-only integration produces no npm release.

`mtlx-core`, `mtlx-viewer`, `mtlx-sdk`, and `mtlx-cli` share one version and publish in dependency order via `pnpm publish` (through `@anolilab/semantic-release-pnpm`, one plugin instance per package), which updates each `package.json` version and rewrites any `workspace:*` internal dependency to a resolved semver range natively. The VS Code extension (`packages/vscode-extension`) shares the same version stream — `release.config.js` pins its `package.json` version to `nextRelease.version` alongside the npm packages — but is never `npm publish`'d; instead it's built, packaged with `vsce`, and published to the VS Code Marketplace and Open VSX Registry (`scripts/release-vscode-extension.mjs`), requiring the `VSCE_PAT` and `OVSX_PAT` repository secrets. The website retains its existing delivery path. Source package versions are development snapshots; the authoritative released version is the Git tag/npm version. It does not write version commits to protected branches.

Each GitHub Release contains generated release notes and all four npm tarballs; [GitHub Releases](https://github.com/bhouston/mtlx/releases) is the cumulative changelog of record. The release job waits for the complete reusable CI suite and only runs from a manual dispatch against `main`. Releases are serialized and never cancel an in-progress publish.

## Validation and recovery

Dispatching `release.yml` with `dry_run=true` runs the full workflow — including CI — and previews what semantic-release would do, without publishing or tagging. `pnpm pack:release` and `pnpm check:release` remain available to inspect the exact tarballs locally before a release.

npm publication across four packages is not atomic. If a release fails after publishing one package, inspect npm, the tag, and the workflow log before retrying. Do not delete published versions or blindly remove tags.

To finish missing artifacts from the exact release commit through trusted CI, dispatch recovery mode on `main`:

```sh
gh workflow run release.yml --ref main -f recover_tag=v0.10.0 -f dry_run=true
gh workflow run release.yml --ref main -f recover_tag=v0.10.0
```

Replace the example tag with the interrupted release’s tag. Recovery requires an existing stable lightweight tag that is an ancestor of `main`. It checks out that tag’s exact commit, installs and builds its source, and reuses its release configuration to prepare and publish artifacts without creating or moving tags. The workflow and recovery code come from current `main`; the source and release plugins come from the tagged commit. Current `main` must pass CI, and the tagged source must have passed CI in the original release run.

Recovery skips npm package versions already present on the registry and stops on registry errors other than a missing-version 404. Extension publishing skips versions that already exist in either marketplace. It generates release notes from the last published GitHub Release to the recovered tag and creates the GitHub Release with all four tarballs only after publishing succeeds. Recovery refuses to proceed if a GitHub Release, including a draft, already exists for that tag; inspect and finish that release separately. Preview mode validates registry state and publishing credentials and generates notes without preparing or publishing artifacts.

### Failure between tagging and publishing

Semantic-release pushes the version tag and its `refs/notes/semantic-release-v<version>` metadata before running any publish plugin. A rejected Git notes push can therefore leave a tag with no published packages or GitHub Release. A normal dispatch may then treat the unpublished version as already released.

Before recovery, inspect the failed job and the exact version for all four packages on npm, GitHub Releases (including drafts), and any extension publishing steps. Preserve the failed run’s commit SHA and tag target. Repair missing Git notes metadata (`{"channels":[null]}` for the default channel) if necessary, then use recovery mode to finish publication while preserving the tag.

For the interrupted `v0.10.0` release, the Git notes push succeeded on retry from a complete local checkout. This established that the metadata could be repaired, but did not establish the cause of GitHub’s earlier `missing necessary objects` rejection. The next attempt published core, viewer, and SDK before npm returned HTTP 503 while publishing the CLI. Recovery mode can finish the remaining artifacts without republishing those versions.
