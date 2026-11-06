import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getUserOption, resolveUserAndName } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'delete [userMaterial]',
  describe: 'Delete a material',
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
      }),
  handler: async (argv) => {
    const { userName, name } = resolveUserAndName(argv.userMaterial, argv.user, argv.name);
    const client = await createClient(getCliDeps(argv));

    await sdk.deleteAsset(client, {
      params: { userName, assetName: name },
    });
  },
});
