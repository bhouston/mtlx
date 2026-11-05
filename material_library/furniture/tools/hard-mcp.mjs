import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
// Override only when authoring from a worktree whose CLI dependencies have not been built.
const repo = process.env.MTLX_REPO || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const require = createRequire(path.join(repo, 'packages/cli/package.json'));
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')).href);
const { StdioClientTransport } = await import(
  pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);
export async function connect() {
  const c = new Client({ name: 'furniture-hard-surfaces', version: '1.0' });
  await c.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(repo, 'packages/cli/bin/cli.js'), 'mcp'],
      stderr: 'pipe',
    }),
  );
  return c;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv[2]) {
  let c = await connect();
  try {
    console.log(
      JSON.stringify(
        await c.callTool({ name: 'list_node_definitions', arguments: { query: process.argv[2], limit: 50 } }),
        null,
        2,
      ),
    );
  } finally {
    await c.close();
  }
}
