import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, getOrgProjectOptions, resolveAssetRef } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'get [material]',
  describe: 'Get material details',
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
        ...formatOption,
      }),
  handler: async (argv) => {
    const { orgName, projectName, name } = resolveAssetRef(argv.material, argv.org, argv.project, argv.name);
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.getAsset(client, {
      params: { orgName, projectName, assetName: name },
    });

    logOutput(asset, argv.format, deps.logger);
  },
});
