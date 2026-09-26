import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getAssetVisibilityOption, getUserOption, paginationOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'list',
  describe: 'List materials',
  builder: (yargs) =>
    yargs.options({
      search: {
        type: 'string',
        description: 'Search text',
      },
      ...getUserOption(),
      ...getAssetVisibilityOption(),
      ...paginationOption,
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const result = await sdk.listAssets(client, {
      query: {
        userName: argv.user,
        visibility: argv.visibility,
        searchText: argv.search,
        pageOffset: argv['page-offset'],
        pageSize: argv['page-size'],
      },
    });

    logOutput(result, argv.format, deps.logger);
  },
});
