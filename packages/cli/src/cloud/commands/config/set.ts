import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'set',
  describe: 'Set default user and/or API host',
  builder: (yargs) =>
    yargs
      .option('user', {
        alias: 'u',
        type: 'string',
        description: 'Default user name (used when --user is omitted from other commands)',
      })
      .option('host', {
        type: 'string',
        description: 'API host URL (defaults to https://api.mtlx.ai)',
      }),
  handler: async (argv) => {
    // Validate user name if provided (including empty strings)
    if (argv.user !== undefined) {
      const result = sdk.userNameSchema.safeParse(argv.user);
      if (!result.success) {
        const errorMessage = result.error.issues.map((e) => e.message).join('; ');
        throw new Error(`Invalid user name: ${errorMessage}`);
      }
    }

    // Validate host if provided
    if (argv.host) {
      // Check that host starts with http:// or https://
      if (!(argv.host.startsWith('http://') || argv.host.startsWith('https://'))) {
        throw new Error('Host must start with http:// or https://');
      }

      if (!sdk.validateUrl(argv.host)) {
        throw new Error('Invalid host URL format');
      }
    }

    // Must set at least one (check after validation so validation errors are shown first)
    if (!(argv.user || argv.host)) {
      throw new Error('Must specify at least --user or --host');
    }

    const deps = getCliDeps(argv);

    // Write to global config
    const globalConfig = await deps.persistentConfig.get();
    if (argv.user) {
      globalConfig.user = argv.user;
    }
    if (argv.host) {
      globalConfig.host = argv.host;
    }

    await deps.persistentConfig.set(globalConfig);
  },
});
