import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// Packages published to npm, in dependency order (core first; cli and
// viewer depend on it via workspace:*, which pnpm publish rewrites to a
// resolved semver range natively).
const packages = ['packages/core', 'packages/viewer', 'packages/cli'];

export default {
  branches: ['main'],
  repositoryUrl: 'https://github.com/bhouston/mtlx.git',
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    // pkgRoot only (no tarballDir): @anolilab/semantic-release-pnpm's tarballDir option
    // shells out to `pnpm pack <pkgRoot>`, which pnpm packs from the cwd instead — pack
    // explicitly below, once all three packages have their final bumped version.
    ...packages.map((path) => ['@anolilab/semantic-release-pnpm', { pkgRoot: path }]),
    {
      prepare: () => {
        // Absolute destination: `pnpm --dir <path>` changes pnpm's cwd, so a relative
        // destination would land inside each package instead of the repo-root
        // `release-artifacts` that @semantic-release/github globs for its release assets.
        const tarballDir = resolve('release-artifacts');
        for (const path of packages) {
          execFileSync('pnpm', ['--dir', path, 'pack', '--pack-destination', tarballDir], {
            stdio: 'inherit',
          });
        }
      },
    },
    [
      '@semantic-release/github',
      {
        assets: ['CHANGELOG.md', 'release-artifacts/*.tgz'],
        successComment: false,
        failComment: false,
        releasedLabels: false,
      },
    ],
  ],
};
