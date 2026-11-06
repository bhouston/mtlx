import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const library = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(library, '../..');
const { launchBrowser } = await import(path.join(root, 'packages/cli/dist/commands/render.js'));
const browser = await launchBrowser();
let gpu;
try {
  const page = await browser.newPage();
  await page.route('http://localhost:47891/**', (route) =>
    route.fulfill({ body: '<!doctype html><title>GPU verification</title>', contentType: 'text/html' }),
  );
  await page.goto('http://localhost:47891/');
  gpu = await page.evaluate(async () => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const adapter = await navigator.gpu?.requestAdapter();
    return {
      webgl: gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      webgpu: adapter
        ? {
            vendor: adapter.info.vendor,
            architecture: adapter.info.architecture,
            device: adapter.info.device,
            description: adapter.info.description,
            isFallbackAdapter: adapter.info.isFallbackAdapter,
          }
        : null,
    };
  });
} finally {
  await browser.close();
}
if (!gpu.webgl || /swiftshader|llvmpipe|lavapipe|software/i.test(gpu.webgl) || gpu.webgpu?.isFallbackAdapter)
  throw new Error(`Hardware GPU required: ${JSON.stringify(gpu)}`);
console.log(JSON.stringify(gpu));
const names = process.argv.slice(2);
const results = [];
for (const name of names) {
  const file = path.join(library, name, `${name}.mtlx`);
  const output = path.join(library, name, 'preview.avif');
  const args = [
    path.join(root, 'packages/cli/bin/cli.js'),
    'render',
    file,
    '-o',
    output,
    '--view',
    'plane',
    'closeup',
    'detail',
    'sphere',
    'totem',
    '--ibl',
    'neutral',
    '--supersample',
    '--size',
    '384',
    '--timeout',
    '180',
  ];
  const start = Date.now();
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 300000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const record = {
    name,
    ok: r.status === 0,
    seconds: (Date.now() - start) / 1000,
    output: path.relative(library, output),
    log: r.stdout + r.stderr,
  };
  results.push(record);
  console.log(`${name}: ${record.ok ? 'OK' : 'FAILED'} ${record.seconds}s`);
  if (!record.ok) console.log(record.log);
}
await mkdir(path.join(library, 'tools'), { recursive: true });
const reportPath = path.join(library, 'tools', 'render-results.json');
let previous = [];
try {
  previous = JSON.parse(await readFile(reportPath, 'utf8')).results;
} catch {}
const replace = new Set(results.map((r) => r.name));
await writeFile(
  reportPath,
  JSON.stringify(
    {
      gpu,
      views: ['plane', 'closeup', 'detail', 'sphere', 'totem'],
      ibl: 'neutral',
      size: 384,
      supersample: true,
      results: [...previous.filter((r) => !replace.has(r.name)), ...results],
    },
    null,
    2,
  ) + '\n',
);
if (results.some((r) => !r.ok)) process.exitCode = 1;
