/** Validate every textile material with the real mtlx MCP stdio server. MTLX_REPO may point to a built checkout. */
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
const here = path.dirname(fileURLToPath(import.meta.url)),
  root = path.resolve(here, '..'),
  repo = process.env.MTLX_REPO ?? path.resolve(here, '../../..');
const sdk = path.join(repo, 'packages/cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client');
const { Client } = await import(pathToFileURL(path.join(sdk, 'index.js')));
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, 'stdio.js')));
const c = new Client({ name: 'furniture-textiles', version: '1.0' });
await c.connect(
  new StdioClientTransport({ command: process.execPath, args: [path.join(repo, 'packages/cli/bin/cli.js'), 'mcp'] }),
);
const rows = JSON.parse(await readFile(path.join(here, 'textile-manifest.json'), 'utf8'));
const failed = [];
let count = 0;
for (const e of rows) {
  const result = await c.callTool({
    name: 'check_material',
    arguments: { file: path.join(root, e.file), strict: true, rules: ['basic', 'structure', 'types', 'unused'] },
  });
  const data = result.content
    .filter((x) => x.type === 'text')
    .map((x) => x.text)
    .join('\n');
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {}
  if (result.isError || !parsed?.ok) {
    failed.push({ name: e.name, result: parsed ?? data });
    if (failed.length < 4) console.log(JSON.stringify(failed.at(-1)));
  }
  count++;
  if (count % 200 === 0) console.log(`${count}/${rows.length}`);
  if (process.env.FIRST_ONLY) break;
}
await c.close();
const report = { checked: count, passed: count - failed.length, failed };
await writeFile(path.join(here, 'textile-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checked: count, failures: failed.length }));
if (failed.length) process.exitCode = 1;
