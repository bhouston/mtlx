import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, paginationOption } from '../lib/args.ts';
import { createClient } from '../lib/client.ts';
import { getCliDeps } from '../lib/deps.ts';
import { logOutput } from '../lib/output.ts';

export const command = defineCommand({
  command: 'search <query>',
  describe: 'Search public materials (shortcut for `materials list --search`)',
  builder: (yargs) =>
    yargs
      .positional('query', {
        type: 'string',
        description: 'Search text',
        demandOption: true,
      })
      .options({
        ...paginationOption,
        ...formatOption,
      }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const result = await sdk.listAssets(client, {
      query: {
        searchText: argv.query,
        pageOffset: argv['page-offset'],
        pageSize: argv['page-size'],
      },
    });

    logOutput(result, argv.format, deps.logger);
  },
});
