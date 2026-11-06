import { writeFile } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import { getMediaOriginalUrl } from 'mtlx-sdk';
import { defineCommand } from 'yargs-file-commands';
import { getUserOption, resolveUserAndName } from '../../lib/args.ts';
import { createClient } from '../../lib/client.ts';
import { getCliDeps } from '../../lib/deps.ts';

export const command = defineCommand({
  command: 'download [userMaterial]',
  describe: 'Download a material file',
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
        output: {
          alias: 'o',
          type: 'string',
          description: 'Output file path (defaults to the material name)',
        },
        ...getUserOption(),
      }),
  handler: async (argv) => {
    const { userName, name } = resolveUserAndName(argv.userMaterial, argv.user, argv.name);
    const client = await createClient(getCliDeps(argv));

    const url = getMediaOriginalUrl(client, {
      params: { userName, assetName: name },
      query: { download: true },
    });
    const result = await client.axios.get(url.toString(), { responseType: 'stream' });
    const fileData = result.data as Readable;

    const outputPath = argv.output ?? name;
    await writeFile(outputPath, fileData);
  },
});
