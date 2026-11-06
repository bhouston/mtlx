import { execFileSync } from 'node:child_process';
import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const run = (args) => execFileSync('pnpm', args, { cwd: fileURLToPath(root), stdio: 'inherit' });
run(['--filter', 'website', 'build:static']);
const app = new URL('static/app/', root);
const html = await readFile(new URL('app.html', app), 'utf8');
await writeFile(new URL('index.html', app), html);
for (const tool of ['viewer', 'editor', 'embed']) {
  await mkdir(new URL(`${tool}/`, app), { recursive: true });
  await writeFile(new URL(`${tool}/index.html`, app), html);
}
await cp(new URL('../website/public/materials/', root), new URL('static/materials/', root), { recursive: true });
await cp(new URL('../../assets/copper/', root), new URL('static/materials/copper/', root), { recursive: true });
await mkdir(new URL('static/viewer-assets/', root), { recursive: true });
await cp(new URL('../static-assets/public/viewer/', root), new URL('static/viewer-assets/', root), { recursive: true });
await copyFile(
  new URL('compat/studio-environment.png', root),
  new URL('static/viewer-assets/studio-environment.png', root),
);
await mkdir(new URL('static/licenses/', root), { recursive: true });
await copyFile(new URL('../viewer/LICENSE.model-viewer', root), new URL('static/licenses/model-viewer.txt', root));
for (const file of ['material-viewer.js', 'material-viewer.js.map'])
  await copyFile(new URL(`../viewer/dist/${file}`, root), new URL(`static/${file}`, root));
execFileSync(
  'node',
  [
    fileURLToPath(new URL('../cli/bin/cli.js', root)),
    'docgen',
    '--output',
    fileURLToPath(new URL('mtlx.opencli.json', root)),
  ],
  { stdio: 'inherit' },
);
const apiEntries = {
  core: ['index.ts', 'session.ts'],
  sdk: ['index.ts'],
  viewer: ['index.ts', 'element.ts', 'renderingSettings.ts', 'diagnostics.ts', 'react/index.ts'],
  editor: ['index.ts', 'model.ts'],
};
for (const [name, entries] of Object.entries(apiEntries))
  run([
    'exec',
    'typedoc',
    '--options',
    'typedoc.json',
    '--tsconfig',
    `../${name}/tsconfig.json`,
    '--entryPoints',
    ...entries.map((entry) => `../${name}/src/${entry}`),
    '--name',
    `mtlx-${name}`,
    '--out',
    `docs/api/${name}`,
  ]);

// Docusaurus includes the page H1 in anchor collision detection. Give this module a distinct
// title so TypeDoc links to its RenderingSettings interface keep their generated anchor.
const settingsPage = new URL('docs/api/viewer/renderingSettings.md', root);
await writeFile(
  settingsPage,
  (await readFile(settingsPage, 'utf8')).replace(/^# renderingSettings\b/, '# Viewer settings'),
);
