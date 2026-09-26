import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  descriptionOption,
  formatOption,
  getAssetVisibilityOption,
  getLicenseOption,
  getUserOption,
  metadataOption,
  resolveUserAndName,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'update [userMaterial]',
  describe: 'Update a material',
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
        'new-name': {
          type: 'string',
          description: 'New material name',
        },
        keywords: {
          type: 'string',
          description: 'Keywords',
        },
        ...getUserOption(),
        ...getAssetVisibilityOption(),
        ...getLicenseOption(),
        ...descriptionOption,
        ...metadataOption,
        ...formatOption,
      }),
  handler: async (argv) => {
    const { userName, name } = resolveUserAndName(argv.userMaterial, argv.user, argv.name);
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.updateAsset(client, {
      params: { userName, assetName: name },
      body: {
        name: argv['new-name'],
        description: argv.description,
        keywords: argv.keywords,
        visibility: argv.visibility,
        shareLicense: argv.license,
        metadata: argv.metadata,
      },
    });

    logOutput(asset, argv.format, deps.logger);
  },
});
