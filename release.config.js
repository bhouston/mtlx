export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    './scripts/semantic-release.mjs',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/github',
      {
        assets: ['publish/*.tgz', 'CHANGELOG.md'],
        successComment: false,
        failComment: false,
        releasedLabels: false,
      },
    ],
  ],
};
