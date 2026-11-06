/** Run the guide's CLI render workflow on selected names, requiring hardware WebGL. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const library = path.resolve(here, '..');
const root = path.resolve(library, '../..');
const { launchBrowser } = await import(path.join(root, 'packages/cli/dist/commands/render.js'));
const manifest = JSON.parse(await readFile(path.join(library, 'catalog.json'), 'utf8'));
const requested = process.argv.slice(2);
assert(requested.length, 'Pass one or more catalog identifiers to preview');
const browser = await launchBrowser(process.env.MTLX_BROWSER);
let gpu;
try {
  const page = await browser.newPage();
  gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) throw new Error('WebGL2 unavailable');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) throw new Error('Cannot confirm hardware renderer');
    return {
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    };
  });
  assert.doesNotMatch(gpu.renderer, /swiftshader|llvmpipe|lavapipe|software|microsoft basic/i, 'Hardware GPU required');
  assert.match(gpu.renderer, /apple|nvidia|radeon|intel|adreno|mali/i, 'Unrecognized GPU; verify hardware manually');
} finally {
  await browser.close();
}
console.log(`Hardware renderer: ${gpu.renderer}`);
const output = path.join(library, 'previews');
await mkdir(output, { recursive: true });
let report = { renderer: gpu, entries: [] };
try {
  report = JSON.parse(await readFile(path.join(here, 'renders.json'), 'utf8'));
} catch {
  /* First run. */
}
report.renderer = gpu;
for (const name of requested) {
  const material = manifest.materials.find((m) => m.name === name);
  assert(material, `Unknown material: ${name}`);
  const file = path.join(library, material.file);
  const hash = createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
  for (const { ibl, views } of [
    { ibl: 'bridge', views: ['plane', 'closeup', 'detail', 'sphere', 'totem'] },
    { ibl: 'neutral', views: ['plane', 'sphere'] },
    { ibl: 'sun', views: ['closeup'] },
    { ibl: 'strips', views: ['sphere'] },
  ]) {
    const image = `previews/${name}-${ibl}.avif`;
    const args = [
      'packages/cli/bin/cli.js',
      'render',
      file,
      '-o',
      path.join(library, image),
      '--view',
      ...views,
      '--ibl',
      ibl,
      '--supersample',
      '--size',
      '384',
      '--timeout',
      '300',
    ];
    const started = Date.now();
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      let log = '';
      child.stdout.on('data', (s) => {
        log += s;
      });
      child.stderr.on('data', (s) => {
        log += s;
      });
      child.on('error', (e) => resolve({ code: -1, log: String(e) }));
      child.on('close', (code) => resolve({ code, log }));
    });
    const entry = {
      name,
      sha256: hash,
      ibl,
      views,
      image,
      size: 384,
      supersample: true,
      seconds: (Date.now() - started) / 1000,
      ...result,
    };
    report.entries = report.entries.filter((e) => !(e.name === name && e.ibl === ibl));
    report.entries.push(entry);
    await writeFile(path.join(here, 'renders.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`${result.code === 0 ? 'PASS' : 'FAIL'} ${name} ${ibl} (${entry.seconds.toFixed(1)}s)`);
    if (result.code !== 0) console.error(result.log);
  }
}
assert(
  report.entries.every((e) => e.code === 0),
  'Render failures; see renders.json',
);
