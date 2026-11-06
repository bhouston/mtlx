import { defineCommand } from 'yargs-file-commands';

import { createClientWithHost } from '../lib/client.ts';
import { getConfig } from '../lib/config.ts';
import { getCliDeps } from '../lib/deps.ts';
import { formatError } from '../lib/errors.ts';

export const command = defineCommand({
  command: 'health',
  describe: 'Check if the API server is healthy and reachable',
  builder: (yargs) =>
    yargs.options({
      host: {
        type: 'string',
        // No 'h' alias: it collides with yargs' global --help/-h alias.
        description: 'API host URL (overrides config)',
      },
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const config = await getConfig(deps);
    const host = argv.host || config.host;

    try {
      const client = createClientWithHost(host);
      const response = await client.axios.get('/health');

      if (response.status === 204) {
        deps.logger.info(`✓ Server is healthy at ${host}`);
        return;
      }

      throw new Error(`Server returned unexpected status: ${response.status}`);
    } catch (error) {
      deps.logger.error(`✗ Health check failed: ${formatError(error)}`);
      throw error;
    }
  },
});
