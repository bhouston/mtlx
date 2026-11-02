import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  formatOption,
  getAssetRequiredOption,
  getOrgProjectOptions,
  paginationOption,
  requireOrgProject,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'list',
  describe: 'List comments for a material',
  builder: (yargs) =>
    yargs.options({
      ...getOrgProjectOptions(),
      ...getAssetRequiredOption(),
      ...paginationOption,
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const result = await sdk.listComments(client, {
      params: {
        ...requireOrgProject(argv.org, argv.project),
        assetName: argv.asset,
      },
      query: {
        pageOffset: argv['page-offset'],
        pageSize: argv['page-size'],
      },
    });
    logOutput(result, argv.format, deps.logger);
  },
});
