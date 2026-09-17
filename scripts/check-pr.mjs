import { readFileSync } from 'node:fs';

const { pull_request: pr, repository } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
if (!pr) throw new Error('Expected a pull_request event');
if (pr.base.ref === 'main') {
  if (pr.head.ref !== 'dev' || pr.head.repo.full_name !== repository.full_name)
    throw new Error('Only a release PR from this repository’s dev branch may target main.');
} else {
  if (pr.base.ref !== 'dev') throw new Error('Contributor PRs must target dev.');
  const match = /^(?:feature|fix|docs|chore|refactor|test|ci|build|perf|style|revert)\/(\d+)-[a-z0-9-]+$/.exec(
    pr.head.ref,
  );
  if (!match) throw new Error('Use a branch such as feature/42-short-description.');
  if (!new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${match[1]}\\b`, 'i').test(pr.body ?? ''))
    throw new Error(`PR body must close its branch issue with Closes #${match[1]}.`);
  if (process.env.GH_TOKEN) {
    const response = await fetch(`https://api.github.com/repos/${repository.full_name}/issues/${match[1]}`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`Cannot verify linked issue: HTTP ${response.status}`);
    const issue = await response.json();
    if (issue.pull_request || issue.state !== 'open') throw new Error('Link an existing open issue, not a PR.');
  }
}
