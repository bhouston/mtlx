import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publish as publishExtension } from './release-vscode-extension.mjs';

export function validateRecoveryTag(tag) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag ?? '')) {
    throw new Error('RECOVER_TAG must be a stable vX.Y.Z tag');
  }
}

export async function isPublished(name, version, fetchRegistry = fetch) {
  const response = await fetchRegistry(`https://registry.npmjs.org/${name}/${version}?recovery=${Date.now()}`, {
    signal: AbortSignal.timeout(30000),
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Cannot inspect ${name}: HTTP ${response.status}`);
  const published = await response.json();
  if (published.name !== name || published.version !== version) throw new Error('Unexpected registry response');
  return true;
}

const gh = (endpoint, jq = '.') =>
  JSON.parse(execFileSync('gh', ['api', endpoint, '--jq', jq], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));

export async function resumeRelease() {
  // Run from the immutable tagged checkout, using the recovery script from main.
  // Reuse that commit's release plugins without creating or moving any Git refs.
  const tag = process.env.RECOVER_TAG;
  validateRecoveryTag(tag);
  if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Recovery must be dispatched on main');
  const cwd = process.cwd();
  const require = createRequire(resolve(cwd, 'package.json'));
  const config = (await import(pathToFileURL(resolve(cwd, 'release.config.js')).href)).default;
  const repo = process.env.GITHUB_REPOSITORY;
  if (repo !== 'bhouston/mtlx') throw new Error('Unexpected repository');
  const target = gh(`repos/${repo}/git/ref/tags/${tag}`);
  if (target.object.type !== 'commit' || target.object.sha !== process.env.RECOVERY_SHA) {
    throw new Error('The release tag has moved or is not the checked-out commit');
  }
  const releases = JSON.parse(
    execFileSync('gh', ['api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`], { encoding: 'utf8' }),
  ).flat();
  if (releases.some((release) => release.tag_name === tag))
    throw new Error('A GitHub Release already exists; inspect it before recovery');
  const previous = releases.find((release) => !release.draft && !release.prerelease);
  if (!previous) throw new Error('No previous published GitHub Release found');
  const comparison = gh(
    `repos/${repo}/compare/${previous.tag_name}...${tag}`,
    '{status,total_commits,base_commit:{sha:.base_commit.sha}}',
  );
  if (comparison.status !== 'ahead') throw new Error('Recovery tag must be ahead of the previous release');
  const pages = JSON.parse(
    execFileSync(
      'gh',
      ['api', '--paginate', '--slurp', `repos/${repo}/compare/${previous.tag_name}...${tag}?per_page=100`],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    ),
  );
  const commits = pages.flatMap((page) =>
    page.commits.map((commit) => ({ hash: commit.sha, message: commit.commit.message })),
  );
  if (commits.length !== comparison.total_commits) throw new Error('Incomplete release history');
  const logger = { log: console.log, warn: console.warn, error: console.error, success: console.log };
  const context = {
    cwd,
    env: process.env,
    stdout: process.stdout,
    stderr: process.stderr,
    logger,
    options: config,
    branch: { name: 'main', type: 'release', main: true },
    branches: [{ name: 'main', type: 'release', main: true }],
    commits,
    lastRelease: {
      version: previous.tag_name.slice(1),
      gitTag: previous.tag_name,
      gitHead: comparison.base_commit.sha,
    },
    nextRelease: {
      version: tag.slice(1),
      gitTag: tag,
      gitHead: target.object.sha,
      channel: undefined,
      type: undefined,
    },
    releases: [],
  };
  const plugins = await Promise.all(
    config.plugins.map(async (entry) => {
      // The inline plugin packs the release and publishes the VS Code extension.
      // Recovery uses the same publisher with duplicate-version handling.
      if (!Array.isArray(entry))
        return { implementation: { ...entry, publish: () => publishExtension({ skipDuplicate: true }) }, options: {} };
      const [name, options] = entry;
      return { name, options, implementation: await import(pathToFileURL(require.resolve(name)).href) };
    }),
  );

  // Only a real 404 means a package is missing. Authentication, rate-limit, and
  // registry failures must stop recovery rather than cause blind republishing.
  for (const plugin of plugins) {
    if (plugin.name !== '@anolilab/semantic-release-pnpm') continue;
    const pkg = JSON.parse(readFileSync(resolve(cwd, plugin.options.pkgRoot, 'package.json'), 'utf8'));
    plugin.published = await isPublished(pkg.name, context.nextRelease.version);
    if (plugin.published) console.log(`Keep existing ${pkg.name}@${context.nextRelease.version}`);
  }
  for (const plugin of plugins) {
    if (plugin.implementation.verifyConditions) await plugin.implementation.verifyConditions(plugin.options, context);
  }
  for (const plugin of plugins) {
    if (plugin.implementation.analyzeCommits)
      context.nextRelease.type = await plugin.implementation.analyzeCommits(plugin.options, context);
    if (plugin.implementation.generateNotes)
      context.nextRelease.notes = await plugin.implementation.generateNotes(plugin.options, context);
  }
  if (process.env.RECOVERY_DRY_RUN === 'true') {
    console.log('Recovery preview complete; no package, extension, tag, or release was published.');
    return;
  }
  if (!process.env.VSCE_PAT || !process.env.OVSX_PAT) throw new Error('Both extension publishing secrets are required');
  for (const plugin of plugins) {
    if (plugin.implementation.prepare) await plugin.implementation.prepare(plugin.options, context);
  }
  for (const plugin of plugins) {
    if (!plugin.published && plugin.implementation.publish)
      await plugin.implementation.publish(plugin.options, context);
  }
  console.log(`Recovered ${tag} from ${target.object.sha}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await resumeRelease();
