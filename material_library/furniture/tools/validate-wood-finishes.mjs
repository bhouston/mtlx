import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = process.env.MTLX_REPO || path.resolve(root, '../..');
const sdk = path.join(repo, 'packages/cli/node_modules/@modelcontextprotocol/sdk/dist/esm/client');
const { Client } = await import(pathToFileURL(path.join(sdk, 'index.js')).href);
const { StdioClientTransport } = await import(pathToFileURL(path.join(sdk, 'stdio.js')).href);
const client = new Client({ name: 'furniture-wood-author', version: '1.0' });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [path.join(repo, 'packages/cli/bin/cli.js'), 'mcp'],
    stderr: 'inherit',
  }),
);
const manifest = JSON.parse(await fs.readFile(path.join(root, 'tools/wood-finishes-manifest.json'), 'utf8'));
const failed = [];
try {
  for (const entry of manifest) {
    const result = await client.callTool({
      name: 'check_material',
      arguments: { file: path.join(root, entry.file), strict: true, rules: ['basic', 'structure', 'types', 'unused'] },
    });
    const message = result.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {}
    if (result.isError || !parsed?.ok) failed.push({ name: entry.name, result: parsed || message });
  }
  console.log(JSON.stringify({ checked: manifest.length, failed }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
} finally {
  await client.close();
}
