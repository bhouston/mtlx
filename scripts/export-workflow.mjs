import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
if (!process.argv[2]) throw new Error('Usage: node scripts/export-workflow.mjs <new-directory>');
const target = resolve(process.argv[2]);
mkdirSync(target); // Deliberately refuse to overwrite an existing directory.
for (const file of [
  'CONTRIBUTING.md',
  'AGENTS.md',
  'CLAUDE.md',
  'SECURITY.md',
  'LICENSE',
  'commitlint.config.js',
  'release.config.js',
  '.husky/commit-msg',
  '.github/ISSUE_TEMPLATE',
  '.github/pull_request_template.md',
  '.github/workflows/ci.yml',
  '.github/workflows/pr-policy.yml',
  '.github/workflows/release.yml',
  'scripts/check-pr.mjs',
  'scripts/semantic-release.mjs',
  'scripts/workflow.test.mjs',
  'scripts/make-release.mjs',
  'scripts/check-release.mjs',
  'scripts/check-readme.mjs',
  'package.json',
  'vitest.config.ts',
  '.nvmrc',
]) {
  mkdirSync(dirname(resolve(target, file)), { recursive: true });
  cpSync(resolve(root, file), resolve(target, file), { recursive: true });
}
writeFileSync(
  resolve(target, 'ROLLOUT.md'),
  `# Workflow pilot export\n\nThis is a reviewable starting point, not a runnable application. Before use:\n\n- Replace repository identity, package paths/names, npm trust, and contact details.\n- Merge scripts/devDependencies into the destination manifest; do not overwrite its manifest.\n- Keep its license and verify ownership before copying a license.\n- Adapt build, tests, artifact smoke checks, coverage scope, and measured size budgets.\n- Install dependencies with pnpm and add Husky prepare/commit-msg hooks.\n- Create dev, configure branch protections, and set it as the default branch.\n- Establish real release ancestry; do not copy another repository's tags.\n- Bootstrap unpublished npm packages, configure trust, then enable the release variable.\n- Test an issue → branch → PR → release before marking a remote repo as a template.\n`,
);
console.log(`Exported workflow for adaptation to ${target}`);
