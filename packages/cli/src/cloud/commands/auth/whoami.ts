import { defineCommand } from 'yargs-file-commands';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'whoami',
  describe: 'Show the current auth type and default user',
  builder: (yargs) => yargs,
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const config = await deps.persistentConfig.get();

    if (!config.auth) {
      deps.logger.info('Not authenticated. Run `mtlx-ai auth login`.');
      return;
    }

    deps.logger.info(`Auth type: ${config.auth.type}`);
    if (config.user) {
      deps.logger.info(`Default user: ${config.user}`);
    } else {
      deps.logger.info('No default user configured. Run `mtlx-ai config set --user <name>`.');
    }
  },
});
