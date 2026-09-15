import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { defineCommand } from 'yargs-file-commands';
import { createMcpServer } from '../mcp.js';

export const command = defineCommand({
  command: 'mcp',
  describe: 'Run a Model Context Protocol server over stdio (check, inspect, render, and edit tools for AI agents)',
  builder: (yargs) => yargs,
  handler: async () => {
    await createMcpServer().connect(new StdioServerTransport());
  },
});
