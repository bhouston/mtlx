import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const library = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(library, '../..');
const require = createRequire(path.join(root, 'packages/cli/package.json'));
const { Client } = await import(require.resolve('@modelcontextprotocol/sdk/client/index.js'));
const { StdioClientTransport } = await import(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
const catalog = await readFile(path.join(root, 'VEHICLE_MATERIAL_CATALOG.md'), 'utf8');
const entries = [...catalog.matchAll(/^- `([^`]+)` — (.+)$/gm)].map((m) => ({ name: m[1], specification: m[2] }));
if (entries.length !== 1404 || new Set(entries.map((e) => e.name)).size !== entries.length)
  throw new Error('Catalog count or uniqueness mismatch');
const actual = (await readdir(library, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && e.name !== 'tools')
  .map((e) => e.name);
const expected = new Set(entries.map((e) => e.name));
const extra = actual.filter((e) => !expected.has(e));
if (extra.length) throw new Error(`Unexpected material directories: ${extra.join(', ')}`);
const client = new Client({ name: 'vehicle-library-verification', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(root, 'packages/cli/bin/cli.js'), 'mcp'],
  stderr: 'inherit',
});
await client.connect(transport);
const failures = [];
try {
  for (const [i, entry] of entries.entries()) {
    const file = path.join(library, entry.name, `${entry.name}.mtlx`);
    try {
      const xml = await readFile(file, 'utf8');
      for (const prefix of ['NG_', 'SR_', 'M_'])
        if (!xml.includes(`name="${prefix}${entry.name}"`)) throw new Error(`Missing ${prefix} name`);
      const result = await client.callTool({
        name: 'check_material',
        arguments: { file, strict: true, rules: ['basic', 'structure', 'types', 'unused'] },
      });
      const report = JSON.parse(
        result.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n'),
      );
      if (result.isError || !report.ok) failures.push({ name: entry.name, report });
    } catch (error) {
      failures.push({ name: entry.name, error: String(error) });
    }
    if ((i + 1) % 100 === 0) console.log(`Checked ${i + 1}/${entries.length}`);
  }
} finally {
  await client.close();
}
const report = {
  catalogCount: entries.length,
  materialCount: actual.length,
  checks: ['basic', 'structure', 'types', 'unused'],
  strict: true,
  failures,
};
await writeFile(path.join(library, 'validation.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
