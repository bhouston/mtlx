import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getUserOption, requireUser } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';
export const command = defineCommand({
  command: 'list',
  describe: 'List API tokens',
  builder: (yargs) =>
    yargs.options({
      type: {
        type: 'string',
        choices: sdk.Enums.ApiTokenType,
        description: 'Filter by token type',
      },
      ...getUserOption(),
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const result = await sdk.listAPITokens(client, {
      query: {
        userName: requireUser(argv.user),
        tokenType: argv.type,
      },
    });
    logOutput(result, argv.format, deps.logger);
  },
});
