import { writeFile } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import { getMediaOriginalUrl } from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getOrgProjectOptions, resolveAssetRef } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'download [material]',
  describe: 'Download a material file',
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
        output: {
          alias: 'o',
          type: 'string',
          description: 'Output file path (defaults to the material name)',
        },
        ...getOrgProjectOptions(),
      }),
  handler: async (argv) => {
    const { orgName, projectName, name } = resolveAssetRef(argv.material, argv.org, argv.project, argv.name);
    const client = await createClient(getCliDeps(argv));

    const url = getMediaOriginalUrl(client, {
      params: { orgName, projectName, assetName: name },
      query: { download: true },
    });
    const result = await client.axios.get(url.toString(), { responseType: 'stream' });
    const fileData = result.data as Readable;

    const outputPath = argv.output ?? name;
    await writeFile(outputPath, fileData);
  },
});
