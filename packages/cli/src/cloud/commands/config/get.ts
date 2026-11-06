import { defineCommand } from 'yargs-file-commands';
import { formatOption } from '../../lib/args.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'get',
  describe: 'Get current default user and API host',
  builder: (yargs) =>
    yargs.options({
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const config = await deps.persistentConfig.get();
    logOutput(config, argv.format, deps.logger);
  },
});
