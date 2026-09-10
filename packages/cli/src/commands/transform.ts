import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';
import {
  TEXTURE_OPTION_GROUP,
  TEXTURE_OPTION_KEYS,
  textureTransformOptions,
  textureTransforms,
} from '../textureOptions.js';

const renderText = (result: { outputPath: string; rootPath: string; entries: string[] }): string =>
  [`Wrote ${result.outputPath}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'transform <input> <output>',
  describe: 'Convert between .mtlx, .mtlz, and .mtlx.zip (pack/unpack), optionally resizing or reformatting textures',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlx, .mtlz, or .mtlx.zip file',
        type: 'string',
        demandOption: true,
      })
      .positional('output', {
        describe: 'Output path; the extension picks the format (a .mtlx path unpacks resources beside it)',
        type: 'string',
        demandOption: true,
      })
      .options(textureTransformOptions)
      .group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)
      .options(formatOption),
  handler: async (argv) => {
    try {
      const pkg = await loadMaterialXPackage(argv.input);
      await transform(pkg, ...textureTransforms(argv));
      const result = await writeMaterialXPackage(pkg, argv.output);
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
