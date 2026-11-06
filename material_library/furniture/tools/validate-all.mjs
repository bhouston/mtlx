import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(process.env.MTLX_REPO ?? resolve(root, '../..'));
const require = createRequire(resolve(repo, 'packages/cli/package.json'));
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')));
const { StdioClientTransport } = await import(
  pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js'))
);
const catalog = JSON.parse(await readFile(resolve(root, 'catalog.json'), 'utf8'));
const client = new Client({ name: 'furniture-library-validation', version: '1.0' });
const failures = [];
let checked = 0;
try {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [resolve(repo, 'packages/cli/bin/cli.js'), 'mcp'],
      stderr: 'pipe',
    }),
  );
  for (const entry of catalog.materials) {
    const result = await client.callTool({
      name: 'check_material',
      arguments: {
        file: resolve(root, entry.path),
        strict: true,
        rules: ['basic', 'structure', 'types', 'unused'],
      },
    });
    const block = result.content.find((c) => c.type === 'text');
    const data = result.isError ? { ok: false, error: block.text } : JSON.parse(block.text);
    if (!data.ok) failures.push({ name: entry.name, ...data });
    checked++;
    if (checked % 250 === 0) console.log(`Checked ${checked}/${catalog.count}`);
  }
} finally {
  await client.close();
}
const report = {
  checked,
  passed: checked - failures.length,
  rules: ['basic', 'structure', 'types', 'unused'],
  strict: true,
  failures,
};
await writeFile(resolve(root, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checked, passed: report.passed, failed: failures.length }));
if (failures.length) process.exitCode = 1;
