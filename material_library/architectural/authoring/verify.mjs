/** Verify catalog coverage and every material using the local mtlx MCP server. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const library = path.resolve(here, '..');
const root = path.resolve(library, '../..');
const require = createRequire(path.join(root, 'packages/cli/package.json'));
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const source = await readFile(path.join(here, 'catalog-source.md'), 'utf8');
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const materials = [];
let family;
for (const line of source.split('\n')) {
  if (line.startsWith('## ')) family = line.slice(3);
  const match = line.match(/^\|\s*`([a-z][A-Za-z0-9]+)`\s*\|\s*(.*?)\s*\|$/);
  if (match)
    materials.push({ name: match[1], family, description: match[2], file: `${slug(family)}/${match[1]}.mtlx` });
}
assert.equal(materials.length, 1277, 'Catalog must contain exactly 1,277 materials');
assert.equal(new Set(materials.map((m) => m.name)).size, materials.length, 'Duplicate identifier');
assert.equal(new Set(materials.map((m) => m.family)).size, 24, 'Expected 24 families');
const actual = [];
for (const dir of await readdir(library, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === 'authoring' || dir.name === 'previews') continue;
  for (const filename of await readdir(path.join(library, dir.name))) {
    if (filename.endsWith('.mtlx')) actual.push(`${dir.name}/${filename}`);
  }
}
assert.deepEqual(actual.toSorted(), materials.map((m) => m.file).toSorted(), 'Catalog/file coverage mismatch');
const client = new Client({ name: 'architectural-library-verifier', version: '1.0' });
const failures = [];
try {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(root, 'packages/cli/bin/cli.js'), 'mcp'],
      cwd: root,
    }),
  );
  for (const [i, material] of materials.entries()) {
    const file = path.join(library, material.file);
    const xml = await readFile(file, 'utf8');
    material.sha256 = createHash('sha256').update(xml).digest('hex');
    assert.match(xml, /<standard_surface\b/, `${material.name}: missing standard_surface`);
    assert.match(xml, /<nodegraph\b/, `${material.name}: missing nodegraph`);
    assert.match(xml, /<texcoord\b/, `${material.name}: missing metric UV coordinates`);
    assert.doesNotMatch(xml, /type="filename"/, `${material.name}: unexpected external texture`);
    const result = await client.callTool({
      name: 'check_material',
      arguments: { file, strict: true, rules: ['basic', 'structure', 'types', 'unused'] },
    });
    const text = result.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n');
    let checked;
    try {
      checked = JSON.parse(text);
    } catch {
      checked = { ok: false, error: text };
    }
    if (result.isError || !checked.ok) failures.push({ name: material.name, ...checked });
    if ((i + 1) % 100 === 0) console.log(`Checked ${i + 1}/${materials.length}`);
  }
} finally {
  await client.close();
}
const manifest = {
  materialxVersion: '1.39',
  uvMetersPerUnit: 1,
  colorSpace: 'lin_rec709',
  catalogSha256: createHash('sha256').update(source).digest('hex'),
  materials,
};
let previews;
if (process.argv.includes('--previews')) {
  const report = JSON.parse(await readFile(path.join(here, 'renders.json'), 'utf8'));
  const channels = JSON.parse(await readFile(path.join(here, 'channel-checks.json'), 'utf8'));
  const hardware = JSON.parse(await readFile(path.join(here, 'hardware.json'), 'utf8'));
  assert.equal(hardware.webgpu.isFallbackAdapter, false, 'Fallback GPU adapter');
  assert.doesNotMatch(hardware.webgl.renderer, /swiftshader|llvmpipe|lavapipe|software/i);
  const covered = new Set();
  for (const entry of [...report.entries, ...channels]) {
    const material = materials.find((m) => m.name === entry.name);
    assert(material, `Unknown preview material: ${entry.name}`);
    assert.equal(entry.code, 0, `Failed preview: ${entry.name} ${entry.ibl}`);
    assert.equal(entry.sha256, material.sha256, `Stale preview: ${entry.name} ${entry.ibl}`);
    const bytes = await readFile(path.join(library, entry.image));
    assert.equal(bytes.subarray(4, 8).toString(), 'ftyp', `Invalid AVIF: ${entry.image}`);
    covered.add(material.family);
  }
  assert.equal(covered.size, 24, 'Previews must cover all 24 families');
  previews = {
    materials: new Set(report.entries.map((e) => e.name)).size,
    contactSheets: report.entries.length,
    channelChecks: channels.length,
    families: covered.size,
    hashesMatch: true,
  };
  console.log(
    `PASS preview integrity: ${previews.materials} materials, ${previews.contactSheets} contact sheets, all 24 families.`,
  );
}
await writeFile(path.join(library, 'catalog.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(
  path.join(here, 'validation.json'),
  JSON.stringify(
    {
      materialCount: materials.length,
      familyCount: 24,
      rules: ['basic', 'structure', 'types', 'unused'],
      strict: true,
      passed: materials.length - failures.length,
      failures,
      previews,
    },
    null,
    2,
  ) + '\n',
);
assert.equal(failures.length, 0, `${failures.length} failed materials; see authoring/validation.json`);
console.log(
  `PASS: ${materials.length} materials across 24 families; strict MCP validation, catalog coverage, no external textures.`,
);
