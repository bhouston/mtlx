import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] ?? resolve(root, '../../FURNITURE_MATERIALS.md'));
let family;
let entries = [];
try {
  const text = await readFile(source, 'utf8');
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) family = line.slice(3).trim();
    const match = line.match(/^- `([^`]+)` — (.*)$/);
    if (match) entries.push({ name: match[1], family, description: match[2] });
  }
} catch (error) {
  if (error.code !== 'ENOENT' || process.argv[2]) throw error;
  entries = JSON.parse(await readFile(resolve(root, 'catalog.json'), 'utf8')).materials;
}
async function files(dir) {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isDirectory()) out.push(...(await files(path)));
    else if (item.name.endsWith('.mtlx')) out.push(path);
  }
  return out;
}
const materials = await files(root);
const byName = new Map();
for (const path of materials) {
  const name = path
    .split('/')
    .at(-1)
    .replace(/\.mtlx$/, '');
  if (byName.has(name)) throw new Error(`Duplicate material: ${name}`);
  byName.set(name, path);
}
const names = new Set(entries.map((e) => e.name));
if (names.size !== entries.length) throw new Error('Duplicate catalog entry');
for (const entry of entries) {
  const path = byName.get(entry.name);
  if (!path) throw new Error(`Missing material: ${entry.name}`);
  entry.path = relative(root, path);
  const xml = await readFile(path, 'utf8');
  if (!xml.includes(`NG_${entry.name}`) || !xml.includes(`SR_${entry.name}`) || !xml.includes(`M_${entry.name}`)) {
    throw new Error(`Nonstandard graph/shader/material names: ${entry.name}`);
  }
  if (/<image\s/.test(xml)) throw new Error(`Unexpected image dependency: ${entry.name}`);
}
for (const name of byName.keys()) if (!names.has(name)) throw new Error(`Unexpected material: ${name}`);
const catalog = { uvMetersPerUnit: 1, heightUnit: 'meter', count: entries.length, materials: entries };
await writeFile(resolve(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
await writeFile(
  resolve(root, 'CATALOG.md'),
  '# Furniture material index\n\nUV 0–1 spans one meter in every material. Heights are in meters.\n\n' +
    [...new Set(entries.map((e) => e.family))]
      .map(
        (f) =>
          `## ${f}\n\n` +
          entries
            .filter((e) => e.family === f)
            .map((e) => `- [${e.name}](${e.path}) — ${e.description}`)
            .join('\n'),
      )
      .join('\n\n') +
    '\n',
);
console.log(
  JSON.stringify({
    materials: entries.length,
    families: new Set(entries.map((e) => e.family)).size,
    missing: 0,
    duplicates: 0,
  }),
);
