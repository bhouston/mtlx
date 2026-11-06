import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const library = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(library, '../..');
const checks = [
  ...['paintMetallicGlossSilver', 'aluminumBrushed', 'woodBurlWalnutGloss'].map((name) => ({
    name,
    ibl: 'strips',
    views: ['sphere'],
  })),
  ...[
    'leatherPigmentedPebbledTan',
    'powderCoatWrinkleBlack',
    'polyurethaneFoamOpenCellCream',
    'decorativeBoucleIvory',
  ].map((name) => ({ name, ibl: 'bridge', views: ['closeup', 'detail', 'sphere'] })),
  { name: 'upholsteryTechnicalKnitBlue', ibl: 'sun', views: ['detail', 'sphere'] },
  ...[
    { name: 'paintSolidGlossBrightRed', range: [-0.00002, 0.00002] },
    { name: 'powderCoatWrinkleBlack', range: [-0.0003, 0.0003] },
    { name: 'leatherPigmentedPebbledTan', range: [-0.0002, 0.0002] },
    { name: 'woodWalnutOpenPore', range: [-0.0002, 0.0002] },
    { name: 'decorativeBoucleIvory', range: [-0.00015, 0.00015] },
  ].map(({ name, range }) => ({ name, ibl: 'neutral', views: ['detail'], channel: 'height', range })),
];
const results = [];
const gpu = JSON.parse(await readFile(path.join(library, 'tools/render-results.json'), 'utf8')).gpu;
if (!gpu.webgl || /swiftshader|llvmpipe|lavapipe|software/i.test(gpu.webgl) || gpu.webgpu?.isFallbackAdapter)
  throw new Error('Verified hardware GPU required; run render-previews.mjs first');
for (const check of checks) {
  const file = path.join(library, check.name, `${check.name}.mtlx`);
  const output = path.join(library, check.name, check.channel ? 'height.avif' : `${check.ibl}.avif`);
  const args = [
    path.join(root, 'packages/cli/bin/cli.js'),
    'render',
    file,
    '-o',
    output,
    '--view',
    ...check.views,
    '--ibl',
    check.ibl,
    '--size',
    '512',
    '--supersample',
    '--timeout',
    '180',
  ];
  if (check.channel) args.push('--channel', check.channel, `--range=${check.range.join(',')}`);
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 300000,
    maxBuffer: 4 * 1024 * 1024,
  });
  results.push({ ...check, ok: r.status === 0, output: path.relative(library, output), log: r.stdout + r.stderr });
  console.log(`${check.name} ${check.channel ?? check.ibl}: ${r.status === 0 ? 'OK' : 'FAILED'}`);
  if (r.status !== 0) console.log(r.stdout + r.stderr);
}
await writeFile(path.join(library, 'tools/detail-results.json'), JSON.stringify({ gpu, results }, null, 2) + '\n');
if (results.some((r) => !r.ok)) process.exitCode = 1;
