import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getOrgProjectOptions, resolveAssetRef } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'delete [material]',
  describe: 'Delete a material',
  builder: (yargs) =>
    yargs
      .positional('material', {
        type: 'string',
        description: '<org>/<project>/<name> (e.g. acme/library/copper), or <name> with --org/--project',
      })
      .options({
        name: {
          type: 'string',
          description: 'Material name (alternative to the positional)',
        },
        ...getOrgProjectOptions(),
      }),
  handler: async (argv) => {
    const { orgName, projectName, name } = resolveAssetRef(argv.material, argv.org, argv.project, argv.name);
    const client = await createClient(getCliDeps(argv));

    await sdk.deleteAsset(client, {
      params: { orgName, projectName, assetName: name },
    });
  },
});
