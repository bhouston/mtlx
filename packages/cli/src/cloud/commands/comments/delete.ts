import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getAssetRequiredOption, getUserOption, requireUser } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'delete <commentId>',
  describe: 'Delete a comment on a material',
  builder: (yargs) =>
    yargs
      .options({
        ...getUserOption(),
        ...getAssetRequiredOption(),
      })
      .positional('commentId', {
        type: 'number',
        description: 'Comment ID',
        demandOption: true,
      }),
  handler: async (argv) => {
    const client = await createClient(getCliDeps(argv));
    await sdk.deleteComment(client, {
      params: {
        userName: requireUser(argv.user),
        assetName: argv.asset,
        commentId: argv.commentId,
      },
    });
  },
});
