# Releases

## Running a release

Releases are never triggered by pushes or merges to `main`. When ready to publish, the maintainer dispatches the workflow:

```sh
gh workflow run release.yml --ref main
```

Add `-f dry_run=true` to validate versioning, the changelog, and staged packages without publishing or tagging. The workflow refuses to run against any ref other than `main`. If there are no release-worthy commits since the last tag, the run succeeds as a no-op and says so in the run summary.

## One-time activation

The workflow is installed in `.github/workflows/release.yml`. Publishing is disabled until the repository Actions variable `NPM_RELEASE_ENABLED` is set to `true`.

1. On npmjs.com, open Settings → Trusted Publisher for **each** package: `mtlx-core`, `mtlx-viewer`, and `mtlx-cli`. Select GitHub Actions and enter:

   | Field                | Value         |
   | -------------------- | ------------- |
   | Organization or user | `bhouston`    |
   | Repository           | `mtlx`        |
   | Workflow filename    | `release.yml` |
   | Environment name     | Leave blank   |

   These are package settings, not repository secrets. No `NPM_TOKEN` or `NODE_AUTH_TOKEN` is needed. The release job publishes with `pnpm` (pinned to `packageManager` in `package.json`) with `id-token: write`; npm supplies automatic provenance for trusted-publisher packages. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

2. If any of `mtlx-core`, `mtlx-viewer`, or `mtlx-cli` are already published on npm from before this workflow existed, tag the commit that matches the currently published versions as a release baseline (for example `git tag v0.4.0 <sha> && git push origin v0.4.0`) before the first dispatch, so semantic-release resumes versioning from there instead of restarting at `1.0.0`. Skip this step if none of the three packages have ever been published; semantic-release will then start at `1.0.0`.
3. `main` is protected: PRs, an up-to-date `ci` check, and resolved conversations are required, including for administrators. Force pushes and deletion are disabled. Merge commits are enabled; linear history is not required. `main` is the default branch so GitHub closes delivered issues on merge.
4. Configure the npm publishers before activation, then set `gh variable set NPM_RELEASE_ENABLED --body true`. Dispatch `Release` on `main` (see above) when ready to publish.

## Versioning and artifacts

Semantic-release analyzes Conventional Commits since the last `v*` tag. `feat` produces a minor, `fix`/`perf` a patch, and `!` or `BREAKING CHANGE:` a major. The highest change wins. A docs/chore-only integration produces no npm release.

`mtlx-core`, `mtlx-viewer`, and `mtlx-cli` share one version and publish in dependency order via `pnpm publish` (through `@anolilab/semantic-release-pnpm`, one plugin instance per package), which updates each `package.json` version and rewrites any `workspace:*` internal dependency to a resolved semver range natively. The website and VS Code Marketplace extension retain their existing delivery paths and are not part of this release. Source package versions are development snapshots; the authoritative released version is the Git tag/npm version. It does not write version commits to protected branches.

Each GitHub Release contains generated release notes, a `CHANGELOG.md` for that release, and all three npm tarballs. The release job waits for the complete reusable CI suite and only runs from a manual dispatch against `main`. Releases are serialized and never cancel an in-progress publish.

## Validation and recovery

Dispatching `release.yml` with `dry_run=true` runs the full workflow — including CI — and previews what semantic-release would do, without publishing or tagging. `pnpm pack:release` and `pnpm check:release` remain available to inspect the exact tarballs locally before a release.

npm publication across three packages is not atomic. If a release fails after publishing one package, inspect npm, the tag, and the workflow log before retrying. Do not delete published versions or blindly remove tags. Finish missing packages from the exact release commit through trusted CI, then complete the GitHub Release. Resolve failures before dispatching another release.
