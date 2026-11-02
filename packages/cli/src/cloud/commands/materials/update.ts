import * as sdk from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import {
  descriptionOption,
  formatOption,
  getAssetVisibilityOption,
  getLicenseOption,
  getOrgProjectOptions,
  metadataOption,
  resolveAssetRef,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { logOutput } from '../../lib/output.ts';

export const command = defineCommand({
  command: 'update [material]',
  describe: 'Update a material',
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
        'new-name': {
          type: 'string',
          description: 'New material name',
        },
        keywords: {
          type: 'string',
          description: 'Keywords',
        },
        ...getOrgProjectOptions(),
        ...getAssetVisibilityOption(),
        ...getLicenseOption(),
        ...descriptionOption,
        ...metadataOption,
        ...formatOption,
      }),
  handler: async (argv) => {
    const { orgName, projectName, name } = resolveAssetRef(argv.material, argv.org, argv.project, argv.name);
    const deps = getCliDeps(argv);
    const client = await createClient(deps);

    const asset = await sdk.updateAsset(client, {
      params: { orgName, projectName, assetName: name },
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
