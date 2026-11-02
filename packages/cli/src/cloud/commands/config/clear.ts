import { defineCommand } from 'yargs-file-commands';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'clear',
  describe: 'Clear default org, project, and/or API host from global config',
  builder: (yargs) =>
    yargs
      .option('org', {
        alias: 'o',
        type: 'boolean',
        description: 'Clear organization name',
      })
      .option('project', {
        alias: 'p',
        type: 'boolean',
        description: 'Clear project name',
      })
      .option('host', {
        type: 'boolean',
        description: 'Clear API host URL',
      }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    // Must clear at least one
    if (!(argv.org || argv.project || argv.host)) {
      throw new Error('Must specify at least --org, --project, or --host');
    }

    // Read global config (without env vars)
    const globalConfig = await deps.persistentConfig.get();

    // Clear specified fields
    if (argv.org) {
      globalConfig.org = undefined;
      // If clearing org, also clear project since project is scoped to org
      if (globalConfig.project) {
        globalConfig.project = undefined;
      }
    }
    if (argv.project && !argv.org) {
      // Only clear project if org wasn't already cleared
      globalConfig.project = undefined;
    }
    if (argv.host) {
      // Reset host to default
      globalConfig.host = undefined;
    }

    await deps.persistentConfig.set(globalConfig);
  },
});
