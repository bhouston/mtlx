import { defineCommand } from 'yargs-file-commands';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'clear',
  describe: 'Clear default user and/or API host from global config',
  builder: (yargs) =>
    yargs
      .option('user', {
        alias: 'u',
        type: 'boolean',
        description: 'Clear default user name',
      })
      .option('host', {
        type: 'boolean',
        description: 'Clear API host URL',
      }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    // Must clear at least one
    if (!(argv.user || argv.host)) {
      throw new Error('Must specify at least --user or --host');
    }

    // Read global config (without env vars)
    const globalConfig = await deps.persistentConfig.get();

    // Clear specified fields
    if (argv.user) {
      globalConfig.user = undefined;
    }
    if (argv.host) {
      // Reset host to default
      globalConfig.host = undefined;
    }

    await deps.persistentConfig.set(globalConfig);
  },
});
