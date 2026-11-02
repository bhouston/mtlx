import { defineCommand } from 'yargs-file-commands';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'whoami',
  describe: 'Show the current auth type and default org/project',
  builder: (yargs) => yargs,
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const config = await deps.persistentConfig.get();

    if (!config.auth) {
      deps.logger.info('Not authenticated. Run `mtlx auth login`.');
      return;
    }

    deps.logger.info(`Auth type: ${config.auth.type}`);
    if (config.org) {
      deps.logger.info(`Default org: ${config.org}`);
      if (config.project) {
        deps.logger.info(`Default project: ${config.project}`);
      }
    } else {
      deps.logger.info('No default org/project configured. Run `mtlx config set --org <org> --project <project>`.');
    }
  },
});
