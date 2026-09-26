import { defineCommand } from 'yargs-file-commands';
import { getAuthStatus } from '../../lib/auth.ts';
import { getConfig } from '../../lib/config.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'status',
  describe: 'Show current authentication status',
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
    await getAuthStatus(host, deps);
  },
});
