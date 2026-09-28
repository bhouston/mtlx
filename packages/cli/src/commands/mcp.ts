import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  command: 'mcp',
  describe: 'Run a Model Context Protocol server over stdio (check, inspect, render, and edit tools for AI agents)',
  builder: (yargs) => yargs,
  handler: async () => {
    // Loaded here so other commands don't pay for the MCP SDK and the render stack at startup.
    const [{ StdioServerTransport }, { createMcpServer }] = await Promise.all([
      import('@modelcontextprotocol/sdk/server/stdio.js'),
      import('../mcp.js'),
    ]);
    await createMcpServer().connect(new StdioServerTransport());
  },
});
