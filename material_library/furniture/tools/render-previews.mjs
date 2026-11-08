import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(process.env.MTLX_REPO ?? resolve(root, '../..'));
const catalog = JSON.parse(await readFile(resolve(root, 'catalog.json'), 'utf8'));
const ibl = process.env.MTLX_IBL ?? 'neutral';
const selected = process.argv.slice(2);
const entries = selected.length
  ? selected.map((name) => {
      const entry = catalog.materials.find((m) => m.name === name);
      if (!entry) throw new Error(`Unknown material: ${name}`);
      return entry;
    })
  : [...new Set(catalog.materials.map((m) => m.family))].map((f) => catalog.materials.find((m) => m.family === f));
await mkdir(resolve(root, 'previews'), { recursive: true });
let results = [];
try {
  results = JSON.parse(await readFile(resolve(root, 'previews/render-results.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (const entry of entries) {
  const output = resolve(root, 'previews', `${entry.name}${ibl === 'neutral' ? '' : `-${ibl}`}.avif`);
  const args = [
    resolve(repo, 'packages/cli/bin/cli.js'),
    'render',
    resolve(root, entry.path),
    '-o',
    output,
    '--view',
    'plane',
    'closeup',
    'detail',
    'sphere',
    'totem',
    '--ibl',
    ibl,
    '--size',
    '384',
    '--supersample',
    '--timeout',
    '300',
  ];
  console.log(`Rendering ${entry.name}`);
  const result = await new Promise((done) => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', (chunk) => {
      log += chunk;
    });
    child.stderr.on('data', (chunk) => {
      log += chunk;
    });
    child.on('error', (error) => done({ ok: false, log: error.message }));
    child.on('close', (code) => done({ ok: code === 0, log }));
  });
  results = results.filter((r) => r.name !== entry.name || (r.ibl ?? 'neutral') !== ibl);
  results.push({ name: entry.name, ibl, ...result });
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${entry.name}: ${result.log.trim()}`);
  await writeFile(resolve(root, 'previews/render-results.json'), JSON.stringify(results, null, 2) + '\n');
}
if (results.some((r) => !r.ok)) process.exitCode = 1;
