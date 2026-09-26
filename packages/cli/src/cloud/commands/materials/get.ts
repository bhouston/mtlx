import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getUserOption, resolveUserAndName } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'get [userMaterial]',
  describe: 'Get material details',
  builder: (yargs) =>
    yargs
      .positional('userMaterial', {
        type: 'string',
        description: '<user>/<name>, e.g. alice/copper',
      })
      .options({
        name: {
          type: 'string',
          description: 'Material name (alternative to <user>/<name>)',
        },
        ...getUserOption(),
        ...formatOption,
      }),
  handler: async (argv) => {
    const { userName, name } = resolveUserAndName(argv.userMaterial, argv.user, argv.name);
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.getAsset(client, {
      params: { userName, assetName: name },
    });

    logOutput(asset, argv.format, deps.logger);
  },
});
