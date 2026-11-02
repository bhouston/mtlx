import { defineCommand } from 'yargs-file-commands';
import {
  descriptionOption,
  getAssetVisibilityOption,
  getLicenseOption,
  getOrgProjectOptions,
  metadataOption,
  requireOrgProject,
} from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';
import { uploadMaterial } from '../../lib/upload.ts';

export const command = defineCommand({
  command: 'upload <file>',
  describe: 'Upload a .mtlx.zip (or .mtlx) file as a new material',
  builder: (yargs) =>
    yargs
      .positional('file', {
        type: 'string',
        description: 'Path to a .mtlx.zip (or .mtlx) file',
        demandOption: true,
      })
      .options({
        name: {
          type: 'string',
          description: 'Material name',
          demandOption: true,
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
      }),
  handler: async (argv) => {
    const { orgName, projectName } = requireOrgProject(argv.org, argv.project);
    const client = await createClient(getCliDeps(argv));

    await uploadMaterial(client, {
      orgName,
      projectName,
      filePath: argv.file,
      name: argv.name,
      description: argv.description,
      keywords: argv.keywords,
      visibility: argv.visibility,
      shareLicense: argv.license,
      metadata: argv.metadata,
    });
  },
});
