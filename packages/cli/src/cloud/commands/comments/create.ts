import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getAssetRequiredOption, getUserOption, requireUser, textOption } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'create',
  describe: 'Create a comment on a material',
  builder: (yargs) =>
    yargs.options({
      ...getUserOption(),
      ...getAssetRequiredOption(),
      ...textOption,
      ...formatOption,
    }),
  handler: async (argv) => {
    const deps = getCliDeps(argv);
    const client = await createClient(deps);
    const comment = await sdk.createComment(client, {
      params: {
        userName: requireUser(argv.user),
        assetName: argv.asset,
      },
      body: { text: argv.text },
    });
    logOutput(comment, argv.format, deps.logger);
  },
});
