/** Compose one saved hardware-rendered sphere per catalog family. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(here, '..');
const root = path.resolve(base, '../..');
const sharp = createRequire(path.join(root, 'packages/cli/package.json'))('sharp');
const manifest = JSON.parse(await readFile(path.join(base, 'catalog.json'), 'utf8'));
const report = JSON.parse(await readFile(path.join(here, 'renders.json'), 'utf8'));
const families = [...new Set(manifest.materials.map((m) => m.family))];
const chosen = families.map((family) => {
  const material = manifest.materials.find(
    (m) => m.family === family && report.entries.some((e) => e.name === m.name && e.ibl === 'bridge' && e.code === 0),
  );
  assert(material, `No saved sphere preview for ${String(family)}`);
  return material;
});
assert.equal(chosen.length, 24);
const images = [];
for (const [i, material] of chosen.entries()) {
  const left = (i % 6) * 192;
  const top = Math.floor(i / 6) * 216;
  const input = await sharp(path.join(base, 'previews', `${material.name}-bridge.avif`))
    .extract({ left: 0, top: 432, width: 384, height: 384 })
    .resize(192, 192)
    .png()
    .toBuffer();
  images.push({ input, left, top });
  const label = `<svg width="192" height="24"><rect width="192" height="24" fill="#222"/><text x="6" y="16" fill="#eee" font-family="Arial" font-size="11" textLength="180" lengthAdjust="spacingAndGlyphs">${material.name}</text></svg>`;
  images.push({ input: Buffer.from(label), left, top: top + 192 });
}
await sharp({ create: { width: 1152, height: 864, channels: 3, background: '#222' } })
  .composite(images)
  .avif({ quality: 65 })
  .toFile(path.join(base, 'previews/overview.avif'));
await writeFile(
  path.join(here, 'gallery.json'),
  JSON.stringify(
    chosen.map((m) => ({ name: m.name, family: m.family, source: `previews/${m.name}-bridge.avif` })),
    null,
    2,
  ) + '\n',
);
console.log('Gallery: 24 families');
